---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'كيف تعمل آلية sandboxing في OpenClaw: الأوضاع، والنطاقات، والوصول إلى مساحة العمل، والصور'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-26T11:30:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83930d5533832f2ece5fd069c15670f8a73c5801c829ca85c249a4582d36ff29
    source_path: gateway/sandboxing.md
    workflow: 15
---

يمكن لـ OpenClaw تشغيل **الأدوات داخل واجهات sandbox الخلفية** لتقليل مساحة الضرر. هذا **اختياري** ويتم التحكم فيه عبر التكوين (`agents.defaults.sandbox` أو `agents.list[].sandbox`). إذا كان sandboxing معطلًا، فستعمل الأدوات على المضيف. يظل Gateway على المضيف؛ بينما يعمل تنفيذ الأدوات في sandbox معزول عند تفعيله.

<Note>
هذا ليس حدًا أمنيًا مثاليًا، لكنه يحد ماديًا من الوصول إلى نظام الملفات والعمليات عندما يقوم النموذج بشيء غير ذكي.
</Note>

## ما الذي يخضع لـ sandboxing

- تنفيذ الأدوات (`exec`، و`read`، و`write`، و`edit`، و`apply_patch`، و`process`، وما إلى ذلك).
- متصفح sandbox اختياري (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="تفاصيل متصفح sandbox">
    - افتراضيًا، يبدأ متصفح sandbox تلقائيًا (ويضمن أن CDP قابل للوصول) عندما تحتاجه أداة المتصفح. ويمكن التكوين عبر `agents.defaults.sandbox.browser.autoStart` و`agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - افتراضيًا، تستخدم حاويات متصفح sandbox شبكة Docker مخصصة (`openclaw-sandbox-browser`) بدلًا من الشبكة العامة `bridge`. ويمكن التكوين عبر `agents.defaults.sandbox.browser.network`.
    - يقيّد الخيار الاختياري `agents.defaults.sandbox.browser.cdpSourceRange` دخول CDP على حافة الحاوية عبر قائمة سماح CIDR ‏(على سبيل المثال `172.21.0.1/32`).
    - يكون وصول المراقبة عبر noVNC محميًا بكلمة مرور افتراضيًا؛ ويصدر OpenClaw عنوان URL برمز مميز قصير العمر يخدم صفحة bootstrap محلية ويفتح noVNC مع كلمة المرور في جزء URL fragment ‏(وليس في سجلات query/header).
    - يسمح `agents.defaults.sandbox.browser.allowHostControl` للجلسات داخل sandbox باستهداف متصفح المضيف صراحةً.
    - تتحكم قوائم السماح الاختيارية في `target: "custom"`: ‏`allowedControlUrls` و`allowedControlHosts` و`allowedControlPorts`.
  </Accordion>
</AccordionGroup>

لا يخضع لـ sandboxing:

- عملية Gateway نفسها.
- أي أداة يُسمح لها صراحةً بالعمل خارج sandbox ‏(مثل `tools.elevated`).
  - **يتجاوز `exec` المرتفع آليات sandboxing ويستخدم مسار الخروج المهيأ (`gateway` افتراضيًا، أو `node` عندما يكون هدف exec هو `node`).**
  - إذا كان sandboxing معطلًا، فلن يغير `tools.elevated` التنفيذ (لأنه يعمل أصلًا على المضيف). راجع [الوضع المرتفع](/ar/tools/elevated).

## الأوضاع

يتحكم `agents.defaults.sandbox.mode` في **متى** يُستخدم sandboxing:

<Tabs>
  <Tab title="off">
    بدون sandboxing.
  </Tab>
  <Tab title="non-main">
    استخدام sandbox فقط للجلسات **غير الرئيسية** (الافتراضي إذا كنت تريد أن تعمل الدردشات العادية على المضيف).

    تعتمد `"non-main"` على `session.mainKey` ‏(الافتراضي `"main"`)، وليس على معرّف الوكيل. وتستخدم جلسات المجموعات/القنوات مفاتيحها الخاصة، لذا تُعد غير رئيسية وسيتم تشغيلها داخل sandbox.

  </Tab>
  <Tab title="all">
    تعمل كل جلسة داخل sandbox.
  </Tab>
</Tabs>

## النطاق

يتحكم `agents.defaults.sandbox.scope` في **عدد الحاويات** التي يتم إنشاؤها:

- `"agent"` ‏(الافتراضي): حاوية واحدة لكل وكيل.
- `"session"`: حاوية واحدة لكل جلسة.
- `"shared"`: حاوية واحدة مشتركة بين جميع الجلسات التي تعمل داخل sandbox.

## الواجهة الخلفية

يتحكم `agents.defaults.sandbox.backend` في **أي بيئة تشغيل** توفّر sandbox:

- `"docker"` ‏(الافتراضي عند تفعيل sandboxing): بيئة sandbox محلية مدعومة بـ Docker.
- `"ssh"`: بيئة sandbox بعيدة عامة مدعومة بـ SSH.
- `"openshell"`: بيئة sandbox مدعومة بـ OpenShell.

يوجد التكوين الخاص بـ SSH ضمن `agents.defaults.sandbox.ssh`. ويوجد التكوين الخاص بـ OpenShell ضمن `plugins.entries.openshell.config`.

### اختيار واجهة خلفية

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **مكان التشغيل**   | حاوية محلية                      | أي مضيف يمكن الوصول إليه عبر SSH | sandbox مُدار بواسطة OpenShell                      |
| **الإعداد**         | `scripts/sandbox-setup.sh`       | مفتاح SSH + مضيف الهدف         | تفعيل Plugin الخاص بـ OpenShell                     |
| **نموذج مساحة العمل** | ربط mount أو نسخ                | canonical بعيد (بذر مرة واحدة) | `mirror` أو `remote`                                |
| **التحكم في الشبكة** | `docker.network` ‏(الافتراضي: none) | يعتمد على المضيف البعيد       | يعتمد على OpenShell                                 |
| **متصفح sandbox**  | مدعوم                            | غير مدعوم                      | غير مدعوم بعد                                       |
| **ربط mounts**      | `docker.binds`                   | غير متاح                       | غير متاح                                            |
| **الأفضل لـ**      | التطوير المحلي، والعزل الكامل    | تفريغ العمل إلى جهاز بعيد      | بيئات sandbox بعيدة مُدارة مع مزامنة ثنائية الاتجاه اختيارية |

### الواجهة الخلفية Docker

يكون sandboxing معطلًا افتراضيًا. وإذا فعّلت sandboxing ولم تختر واجهة خلفية، يستخدم OpenClaw واجهة Docker الخلفية. فهو ينفذ الأدوات ومتصفحات sandbox محليًا عبر مقبس Docker daemon ‏(`/var/run/docker.sock`). ويُحدَّد عزل حاوية sandbox بواسطة مساحات الأسماء في Docker.

<Warning>
**قيود Docker-out-of-Docker ‏(DooD)**

إذا قمت بنشر OpenClaw Gateway نفسه كحاوية Docker، فإنه ينسق حاويات sandbox شقيقة باستخدام مقبس Docker الخاص بالمضيف ‏(DooD). ويؤدي هذا إلى قيد محدد على تعيين المسارات:

- **يتطلب التكوين مسارات المضيف**: يجب أن يحتوي تكوين `workspace` في `openclaw.json` على **المسار المطلق للمضيف** (مثل `/home/user/.openclaw/workspaces`)، وليس المسار الداخلي لحاوية Gateway. فعندما يطلب OpenClaw من Docker daemon إنشاء sandbox، يقيّم daemon المسارات نسبةً إلى مساحة اسم نظام تشغيل المضيف، وليس إلى مساحة اسم Gateway.
- **تكافؤ جسر نظام الملفات (خريطة حجم متطابقة)**: تكتب عملية OpenClaw Gateway الأصلية أيضًا ملفات Heartbeat والجسر إلى دليل `workspace`. ولأن Gateway يقيّم السلسلة النصية نفسها بالضبط (مسار المضيف) من داخل بيئته المحوّاة نفسها، يجب أن يتضمن نشر Gateway خريطة حجم مطابقة تربط مساحة اسم المضيف أصلًا (`-v /home/user/.openclaw:/home/user/.openclaw`).

إذا قمت بتعيين المسارات داخليًا من دون تكافؤ مطلق لمسار المضيف، فسيرمي OpenClaw أصلًا خطأ أذونات `EACCES` عند محاولته كتابة Heartbeat داخل بيئة الحاوية لأن سلسلة المسار المؤهلة بالكامل لا توجد أصلًا.
</Warning>

### الواجهة الخلفية SSH

استخدم `backend: "ssh"` عندما تريد أن يقوم OpenClaw بتشغيل `exec` وأدوات الملفات وقراءات الوسائط داخل sandbox على أي جهاز يمكن الوصول إليه عبر SSH.

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
          // أو استخدم SecretRefs / محتويات مضمنة بدلًا من الملفات المحلية:
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
    - ينشئ OpenClaw جذرًا بعيدًا لكل نطاق ضمن `sandbox.ssh.workspaceRoot`.
    - عند أول استخدام بعد الإنشاء أو إعادة الإنشاء، يقوم OpenClaw ببذر مساحة العمل البعيدة مرة واحدة من مساحة العمل المحلية.
    - بعد ذلك، تعمل `exec` و`read` و`write` و`edit` و`apply_patch` وقراءات وسائط المطالبات وتجهيز الوسائط الواردة مباشرةً على مساحة العمل البعيدة عبر SSH.
    - لا يزامن OpenClaw التغييرات البعيدة مرة أخرى إلى مساحة العمل المحلية تلقائيًا.
  </Accordion>
  <Accordion title="مواد المصادقة">
    - `identityFile` و`certificateFile` و`knownHostsFile`: استخدم الملفات المحلية الموجودة ومررها عبر تكوين OpenSSH.
    - `identityData` و`certificateData` و`knownHostsData`: استخدم سلاسل مضمنة أو SecretRefs. يقوم OpenClaw بحلها عبر لقطة وقت التشغيل العادية للأسرار، ويكتبها في ملفات مؤقتة بأذونات `0600`، ويحذفها عند انتهاء جلسة SSH.
    - إذا تم تعيين كل من `*File` و`*Data` للعنصر نفسه، فإن `*Data` يفوز لتلك الجلسة من SSH.
  </Accordion>
  <Accordion title="نتائج remote-canonical">
    هذا نموذج **remote-canonical**. تصبح مساحة العمل البعيدة عبر SSH هي حالة sandbox الحقيقية بعد البذر الأولي.

    - لا تظهر التعديلات المحلية على المضيف التي تتم خارج OpenClaw بعد خطوة البذر عن بُعد حتى تعيد إنشاء sandbox.
    - يؤدي `openclaw sandbox recreate` إلى حذف الجذر البعيد لكل نطاق ثم البذر مجددًا من المحلي عند الاستخدام التالي.
    - لا يُدعَم تشغيل المتصفح داخل sandbox على الواجهة الخلفية SSH.
    - لا تنطبق إعدادات `sandbox.docker.*` على الواجهة الخلفية SSH.

  </Accordion>
</AccordionGroup>

### الواجهة الخلفية OpenShell

استخدم `backend: "openshell"` عندما تريد أن يقوم OpenClaw بتشغيل الأدوات داخل sandbox في بيئة بعيدة يديرها OpenShell. وللحصول على دليل الإعداد الكامل، ومرجع التكوين، ومقارنة أوضاع مساحة العمل، راجع صفحة [OpenShell](/ar/gateway/openshell) المخصصة.

يعيد OpenShell استخدام نقل SSH الأساسي نفسه وجسر نظام الملفات البعيد نفسه الموجودين في الواجهة الخلفية SSH العامة، ويضيف دورة حياة خاصة بـ OpenShell ‏(`sandbox create/get/delete`، و`sandbox ssh-config`) إلى جانب وضع مساحة العمل الاختياري `mirror`.

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

- `mirror` ‏(الافتراضي): تظل مساحة العمل المحلية canonical. يزامن OpenClaw الملفات المحلية إلى OpenShell قبل exec ويزامن مساحة العمل البعيدة مرة أخرى بعد exec.
- `remote`: تصبح مساحة عمل OpenShell هي canonical بعد إنشاء sandbox. يبذر OpenClaw مساحة العمل البعيدة مرة واحدة من مساحة العمل المحلية، ثم تعمل أدوات الملفات وexec مباشرة على sandbox البعيد من دون مزامنة التغييرات مرة أخرى.

<AccordionGroup>
  <Accordion title="تفاصيل النقل البعيد">
    - يطلب OpenClaw من OpenShell تكوين SSH خاصًا بـ sandbox عبر `openshell sandbox ssh-config <name>`.
    - يكتب core تكوين SSH هذا في ملف مؤقت، ويفتح جلسة SSH، ويعيد استخدام جسر نظام الملفات البعيد نفسه المستخدم مع `backend: "ssh"`.
    - في وضع `mirror` فقط تختلف دورة الحياة: مزامنة من المحلي إلى البعيد قبل exec، ثم مزامنة عكسية بعد exec.
  </Accordion>
  <Accordion title="قيود OpenShell الحالية">
    - متصفح sandbox غير مدعوم بعد
    - `sandbox.docker.binds` غير مدعوم على الواجهة الخلفية OpenShell
    - لا تزال مفاتيح وقت التشغيل الخاصة بـ Docker ضمن `sandbox.docker.*` تنطبق فقط على الواجهة الخلفية Docker
  </Accordion>
</AccordionGroup>

#### أوضاع مساحة العمل

يحتوي OpenShell على نموذجي مساحة عمل. وهذا هو الجزء الأهم عمليًا.

<Tabs>
  <Tab title="mirror (local canonical)">
    استخدم `plugins.entries.openshell.config.mode: "mirror"` عندما تريد أن **تظل مساحة العمل المحلية هي canonical**.

    السلوك:

    - قبل `exec`، يزامن OpenClaw مساحة العمل المحلية إلى sandbox الخاص بـ OpenShell.
    - بعد `exec`، يزامن OpenClaw مساحة العمل البعيدة مرة أخرى إلى مساحة العمل المحلية.
    - لا تزال أدوات الملفات تعمل عبر جسر sandbox، لكن تظل مساحة العمل المحلية مصدر الحقيقة بين الأدوار.

    استخدم هذا عندما:

    - تقوم بتحرير الملفات محليًا خارج OpenClaw وتريد أن تظهر هذه التغييرات داخل sandbox تلقائيًا
    - تريد أن يتصرف sandbox الخاص بـ OpenShell بشكل يشبه الواجهة الخلفية Docker قدر الإمكان
    - تريد أن تعكس مساحة عمل المضيف عمليات الكتابة داخل sandbox بعد كل دور exec

    المقايضة: تكلفة مزامنة إضافية قبل exec وبعده.

  </Tab>
  <Tab title="remote (OpenShell canonical)">
    استخدم `plugins.entries.openshell.config.mode: "remote"` عندما تريد أن **تصبح مساحة عمل OpenShell هي canonical**.

    السلوك:

    - عند إنشاء sandbox لأول مرة، يقوم OpenClaw ببذر مساحة العمل البعيدة من مساحة العمل المحلية مرة واحدة.
    - بعد ذلك، تعمل `exec` و`read` و`write` و`edit` و`apply_patch` مباشرة على مساحة عمل OpenShell البعيدة.
    - لا يقوم OpenClaw **بمزامنة** التغييرات البعيدة مرة أخرى إلى مساحة العمل المحلية بعد exec.
    - لا تزال قراءات الوسائط وقت المطالبة تعمل لأن أدوات الملفات والوسائط تقرأ عبر جسر sandbox بدلًا من افتراض وجود مسار محلي على المضيف.
    - يكون النقل عبر SSH إلى sandbox الخاص بـ OpenShell الذي يعيده `openshell sandbox ssh-config`.

    النتائج المهمة:

    - إذا قمت بتحرير الملفات على المضيف خارج OpenClaw بعد خطوة البذر، فلن يرى sandbox البعيد **تلك التغييرات** تلقائيًا.
    - إذا أُعيد إنشاء sandbox، تُبذر مساحة العمل البعيدة مرة أخرى من مساحة العمل المحلية.
    - مع `scope: "agent"` أو `scope: "shared"`، تتم مشاركة مساحة العمل البعيدة نفسها على هذا النطاق نفسه.

    استخدم هذا عندما:

    - يجب أن يعيش sandbox أساسًا على الجانب البعيد لـ OpenShell
    - تريد تكلفة مزامنة أقل لكل دور
    - لا تريد أن تقوم التعديلات المحلية على المضيف بالكتابة فوق حالة sandbox البعيدة بصمت

  </Tab>
</Tabs>

اختر `mirror` إذا كنت ترى أن sandbox بيئة تنفيذ مؤقتة. واختر `remote` إذا كنت ترى أن sandbox هو مساحة العمل الحقيقية.

#### دورة حياة OpenShell

لا تزال بيئات OpenShell داخل sandbox تُدار عبر دورة الحياة العادية لـ sandbox:

- يعرض `openclaw sandbox list` بيئات OpenShell بالإضافة إلى بيئات Docker
- يحذف `openclaw sandbox recreate` بيئة التشغيل الحالية ويسمح لـ OpenClaw بإعادة إنشائها عند الاستخدام التالي
- يكون منطق التنظيف مدركًا للواجهة الخلفية أيضًا

بالنسبة إلى وضع `remote`، تكون إعادة الإنشاء مهمة بشكل خاص:

- تؤدي إعادة الإنشاء إلى حذف مساحة العمل البعيدة canonical لذلك النطاق
- يقوم الاستخدام التالي ببذر مساحة عمل بعيدة جديدة من مساحة العمل المحلية

أما في وضع `mirror`، فتعيد إعادة الإنشاء ضبط بيئة التنفيذ البعيدة أساسًا لأن مساحة العمل المحلية تظل canonical على أي حال.

## الوصول إلى مساحة العمل

يتحكم `agents.defaults.sandbox.workspaceAccess` في **ما الذي يمكن لـ sandbox رؤيته**:

<Tabs>
  <Tab title="none (الافتراضي)">
    ترى الأدوات مساحة عمل sandbox ضمن `~/.openclaw/sandboxes`.
  </Tab>
  <Tab title="ro">
    يربط مساحة عمل الوكيل للقراءة فقط عند `/agent` ‏(ويعطّل `write`/`edit`/`apply_patch`).
  </Tab>
  <Tab title="rw">
    يربط مساحة عمل الوكيل للقراءة والكتابة عند `/workspace`.
  </Tab>
</Tabs>

مع الواجهة الخلفية OpenShell:

- لا يزال وضع `mirror` يستخدم مساحة العمل المحلية كمصدر canonical بين أدوار exec
- يستخدم وضع `remote` مساحة عمل OpenShell البعيدة كمصدر canonical بعد البذر الأولي
- لا يزال `workspaceAccess: "ro"` و`"none"` يقيّدان سلوك الكتابة بالطريقة نفسها

تُنسخ الوسائط الواردة إلى مساحة العمل النشطة داخل sandbox ‏(`media/inbound/*`).

<Note>
**ملاحظة حول Skills:** تكون أداة `read` مقيّدة بجذر sandbox. ومع `workspaceAccess: "none"`، يقوم OpenClaw بعكس Skills المؤهلة إلى مساحة عمل sandbox ‏(`.../skills`) حتى يمكن قراءتها. ومع `"rw"`، تصبح Skills الخاصة بمساحة العمل قابلة للقراءة من `/workspace/skills`.
</Note>

## ربط mounts مخصصة

يقوم `agents.defaults.sandbox.docker.binds` بربط أدلة مضيف إضافية داخل الحاوية. الصيغة: `host:container:mode` ‏(مثل `"/home/user/source:/source:rw"`).

يتم **دمج** الربوط العامة وتلك الخاصة بكل وكيل (ولا يتم استبدالها). ومع `scope: "shared"`، يتم تجاهل الربوط الخاصة بكل وكيل.

يقوم `agents.defaults.sandbox.browser.binds` بربط أدلة مضيف إضافية داخل حاوية **متصفح sandbox** فقط.

- عند ضبطه (بما في ذلك `[]`)، فإنه يستبدل `agents.defaults.sandbox.docker.binds` لحاوية المتصفح.
- وعند حذفه، تعود حاوية المتصفح إلى `agents.defaults.sandbox.docker.binds` ‏(للتوافق مع الإصدارات السابقة).

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

- تتجاوز الربوط نظام ملفات sandbox: فهي تكشف مسارات المضيف بالوضع الذي تحدده (`:ro` أو `:rw`).
- يحظر OpenClaw مصادر الربط الخطرة (مثل: `docker.sock`، و`/etc`، و`/proc`، و`/sys`، و`/dev`، والربوط الأصلية التي قد تكشفها).
- ويحظر OpenClaw أيضًا جذور بيانات الاعتماد الشائعة في الدليل الرئيسي مثل `~/.aws`، و`~/.cargo`، و`~/.config`، و`~/.docker`، و`~/.gnupg`، و`~/.netrc`، و`~/.npm`، و`~/.ssh`.
- لا يقتصر التحقق من صحة الربط على مطابقة السلاسل النصية. إذ يقوم OpenClaw بتطبيع مسار المصدر، ثم يحله مرة أخرى عبر أعمق سلف موجود قبل إعادة فحص المسارات المحظورة والجذور المسموح بها.
- وهذا يعني أن محاولات الهروب عبر symlink-parent لا تزال تفشل بشكل مغلق حتى عندما لا تكون الورقة النهائية موجودة بعد. مثال: لا يزال `/workspace/run-link/new-file` يُحل إلى `/var/run/...` إذا كانت `run-link` تشير إليه.
- تُطبَّع جذور المصدر المسموح بها بالطريقة نفسها، لذا فإن المسار الذي يبدو فقط داخل قائمة السماح قبل حل symlink يُرفض أيضًا باعتباره `outside allowed roots`.
- يجب أن تكون الربوط الحساسة (الأسرار، ومفاتيح SSH، وبيانات اعتماد الخدمات) `:ro` ما لم تكن هناك حاجة مطلقة.
- اجمعها مع `workspaceAccess: "ro"` إذا كنت تحتاج فقط إلى وصول قراءة إلى مساحة العمل؛ إذ تظل أوضاع الربط مستقلة.
- راجع [Sandbox مقابل سياسة الأدوات مقابل Elevated](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) لمعرفة كيفية تفاعل الربوط مع سياسة الأدوات وexec المرتفع.
</Warning>

## الصور والإعداد

صورة Docker الافتراضية: `openclaw-sandbox:bookworm-slim`

<Steps>
  <Step title="إنشاء الصورة الافتراضية">
    ```bash
    scripts/sandbox-setup.sh
    ```

    لا تتضمن الصورة الافتراضية **Node**. وإذا كانت Skill ما تحتاج إلى Node ‏(أو بيئات تشغيل أخرى)، فإما أن تنشئ صورة مخصصة أو تثبّت عبر `sandbox.docker.setupCommand` ‏(وهذا يتطلب خروجًا شبكيًا + جذرًا قابلًا للكتابة + مستخدم root).

  </Step>
  <Step title="اختياري: إنشاء الصورة الشائعة">
    للحصول على صورة sandbox أكثر عملية بأدوات شائعة (مثل `curl`، و`jq`، و`nodejs`، و`python3`، و`git`):

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    ثم اضبط `agents.defaults.sandbox.docker.image` على `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="اختياري: إنشاء صورة متصفح sandbox">
    ```bash
    scripts/sandbox-browser-setup.sh
    ```
  </Step>
</Steps>

افتراضيًا، تعمل حاويات Docker داخل sandbox **من دون شبكة**. ويمكن تجاوز ذلك عبر `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="إعدادات Chromium الافتراضية في متصفح sandbox">
    تطبق صورة متصفح sandbox المضمنة أيضًا إعدادات بدء تشغيل محافظة لـ Chromium من أجل أعباء العمل داخل الحاويات. وتتضمن الإعدادات الحالية للحاوية ما يلي:

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
    - تكون أعلام تقوية الرسوميات الثلاثة (`--disable-3d-apis`، و`--disable-software-rasterizer`، و`--disable-gpu`) اختيارية، وهي مفيدة عندما تفتقر الحاويات إلى دعم GPU. اضبط `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` إذا كان حمل العمل لديك يتطلب WebGL أو ميزات متصفح/ثلاثية الأبعاد أخرى.
    - يكون `--disable-extensions` مفعّلًا افتراضيًا ويمكن تعطيله عبر `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` للتدفقات المعتمدة على الإضافات.
    - يتم التحكم في `--renderer-process-limit=2` عبر `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`، حيث تجعل القيمة `0` Chromium يحتفظ بالإعداد الافتراضي الخاص به.

    إذا كنت تحتاج إلى ملف تعريف تشغيل مختلف، فاستخدم صورة متصفح مخصصة وقدّم نقطة دخول خاصة بك. أما بالنسبة إلى ملفات تعريف Chromium المحلية (غير داخل الحاوية)، فاستخدم `browser.extraArgs` لإلحاق أعلام بدء تشغيل إضافية.

  </Accordion>
  <Accordion title="إعدادات الأمان الافتراضية للشبكة">
    - يتم حظر `network: "host"`.
    - يتم حظر `network: "container:<id>"` افتراضيًا (بسبب خطر تجاوز الانضمام إلى مساحة الأسماء).
    - تجاوز break-glass: ‏`agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.
  </Accordion>
</AccordionGroup>

توجد عمليات تثبيت Docker وGateway المُشغَّل داخل حاوية هنا: [Docker](/ar/install/docker)

بالنسبة إلى عمليات نشر Gateway عبر Docker، يمكن لـ `scripts/docker/setup.sh` تهيئة تكوين sandbox. اضبط `OPENCLAW_SANDBOX=1` ‏(أو `true`/`yes`/`on`) لتمكين هذا المسار. ويمكنك تجاوز موقع المقبس عبر `OPENCLAW_DOCKER_SOCKET`. الإعداد الكامل ومرجع متغيرات البيئة: [Docker](/ar/install/docker#agent-sandbox).

## setupCommand ‏(إعداد الحاوية لمرة واحدة)

يعمل `setupCommand` **مرة واحدة** بعد إنشاء حاوية sandbox ‏(وليس في كل تشغيل). ويتم تنفيذه داخل الحاوية عبر `sh -lc`.

المسارات:

- عام: `agents.defaults.sandbox.docker.setupCommand`
- لكل وكيل: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="المشكلات الشائعة">
    - القيمة الافتراضية لـ `docker.network` هي `"none"` ‏(من دون خروج شبكي)، لذا ستفشل عمليات تثبيت الحزم.
    - يتطلب `docker.network: "container:<id>"` القيمة `dangerouslyAllowContainerNamespaceJoin: true` وهو مخصص فقط لحالات break-glass.
    - يمنع `readOnlyRoot: true` عمليات الكتابة؛ اضبط `readOnlyRoot: false` أو أنشئ صورة مخصصة.
    - يجب أن يكون `user` هو root لعمليات تثبيت الحزم (احذف `user` أو اضبط `user: "0:0"`).
    - لا يرث sandbox exec قيمة `process.env` الخاصة بالمضيف. استخدم `agents.defaults.sandbox.docker.env` ‏(أو صورة مخصصة) لمفاتيح API الخاصة بـ Skills.
  </Accordion>
</AccordionGroup>

## سياسة الأدوات ومسارات الهروب

تظل سياسات السماح/المنع الخاصة بالأدوات مطبقة قبل قواعد sandbox. وإذا كانت أداة ما ممنوعة عالميًا أو لكل وكيل، فلن يعيدها sandboxing.

يمثل `tools.elevated` مسار هروب صريحًا يشغّل `exec` خارج sandbox ‏(`gateway` افتراضيًا، أو `node` عندما يكون هدف exec هو `node`). ولا تنطبق توجيهات `/exec` إلا على المرسلين المصرح لهم وتُحفَظ لكل جلسة؛ ولتعطيل `exec` بشكل صارم، استخدم منع سياسة الأدوات (راجع [Sandbox مقابل سياسة الأدوات مقابل Elevated](/ar/gateway/sandbox-vs-tool-policy-vs-elevated)).

تصحيح الأخطاء:

- استخدم `openclaw sandbox explain` لفحص وضع sandbox الفعلي وسياسة الأدوات ومفاتيح التكوين الخاصة بالإصلاح.
- راجع [Sandbox مقابل سياسة الأدوات مقابل Elevated](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) للاطلاع على النموذج الذهني لعبارة "لماذا تم حظر هذا؟".

أبقِه مقيدًا بإحكام.

## التجاوزات متعددة الوكلاء

يمكن لكل وكيل تجاوز إعدادات sandbox + الأدوات: ‏`agents.list[].sandbox` و`agents.list[].tools` ‏(بالإضافة إلى `agents.list[].tools.sandbox.tools` لسياسة أدوات sandbox). راجع [Sandbox والأدوات متعددة الوكلاء](/ar/tools/multi-agent-sandbox-tools) لمعرفة الأولوية.

## مثال تمكين أدنى

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

## ذو صلة

- [Sandbox والأدوات متعددة الوكلاء](/ar/tools/multi-agent-sandbox-tools) — التجاوزات لكل وكيل والأولوية
- [OpenShell](/ar/gateway/openshell) — إعداد الواجهة الخلفية المُدارة لـ sandbox، وأوضاع مساحة العمل، ومرجع التكوين
- [تكوين sandbox](/ar/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox مقابل سياسة الأدوات مقابل Elevated](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) — تصحيح "لماذا تم حظر هذا؟"
- [الأمان](/ar/gateway/security)
