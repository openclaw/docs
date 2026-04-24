---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: 'كيف يعمل Sandboxing في OpenClaw: الأوضاع، والنطاقات، ووصول مساحة العمل، والصور'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-24T07:43:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07be63b71a458a17020f33a24d60e6d8d7007d4eaea686a21acabf4815c3f653
    source_path: gateway/sandboxing.md
    workflow: 15
---

يمكن لـ OpenClaw تشغيل **الأدوات داخل واجهات sandbox الخلفية** لتقليل نطاق التأثير.
وهذا **اختياري** ويُتحكَّم فيه عبر الإعدادات (`agents.defaults.sandbox` أو
`agents.list[].sandbox`). وإذا كان Sandboxing معطّلًا، تعمل الأدوات على المضيف.
يبقى Gateway على المضيف؛ بينما يعمل تنفيذ الأدوات داخل sandbox معزولة
عند التمكين.

هذا ليس حدًا أمنيًا مثاليًا، لكنه يقلّل فعليًا من الوصول إلى نظام الملفات
والعمليات عندما يقوم النموذج بشيء غير حكيم.

## ما الذي يتم عزله داخل sandbox

- تنفيذ الأدوات (`exec` و`read` و`write` و`edit` و`apply_patch` و`process` وما إلى ذلك).
- متصفح sandbox اختياري (`agents.defaults.sandbox.browser`).
  - افتراضيًا، يبدأ متصفح sandbox تلقائيًا (ويضمن أن يكون CDP قابلًا للوصول) عندما تحتاجه أداة المتصفح.
    اضبط ذلك عبر `agents.defaults.sandbox.browser.autoStart` و`agents.defaults.sandbox.browser.autoStartTimeoutMs`.
  - افتراضيًا، تستخدم حاويات متصفح sandbox شبكة Docker مخصصة (`openclaw-sandbox-browser`) بدلًا من شبكة `bridge` العامة.
    اضبط ذلك عبر `agents.defaults.sandbox.browser.network`.
  - تقيّد القيمة الاختيارية `agents.defaults.sandbox.browser.cdpSourceRange` وصول CDP على حافة الحاوية باستخدام allowlist من نوع CIDR ‏(مثل `172.21.0.1/32`).
  - يكون وصول المراقبة عبر noVNC محميًا بكلمة مرور افتراضيًا؛ ويُصدر OpenClaw عنوان URL برمز قصير العمر يخدم صفحة bootstrap محلية ويفتح noVNC مع كلمة المرور في fragment الخاص بعنوان URL ‏(وليس في query/header logs).
  - تسمح `agents.defaults.sandbox.browser.allowHostControl` للجلسات المعزولة باستهداف متصفح المضيف صراحةً.
  - تتحكم allowlists اختيارية في `target: "custom"`: ‏`allowedControlUrls` و`allowedControlHosts` و`allowedControlPorts`.

ما لا يتم عزله داخل sandbox:

- عملية Gateway نفسها.
- أي أداة مسموح لها صراحةً بالعمل خارج sandbox ‏(مثل `tools.elevated`).
  - **يتجاوز exec المرتفع العزل sandboxing ويستخدم مسار الهروب المهيأ (`gateway` افتراضيًا، أو `node` عندما يكون هدف exec هو `node`).**
  - إذا كان Sandboxing معطّلًا، فلن تغيّر `tools.elevated` التنفيذ (فهو يعمل بالفعل على المضيف). راجع [Elevated Mode](/ar/tools/elevated).

## الأوضاع

تتحكم `agents.defaults.sandbox.mode` في **موعد** استخدام Sandboxing:

- `"off"`: بدون Sandboxing.
- `"non-main"`: اعزل داخل sandbox فقط الجلسات **غير الرئيسية** (الافتراضي إذا كنت تريد الدردشات العادية على المضيف).
- `"all"`: تعمل كل جلسة داخل sandbox.
  ملاحظة: تستند `"non-main"` إلى `session.mainKey` ‏(الافتراضي `"main"`)، وليس إلى معرّف الوكيل.
  تستخدم جلسات المجموعات/القنوات مفاتيحها الخاصة، لذلك تُعد غير رئيسية وسيتم عزلها داخل sandbox.

## النطاق

تتحكم `agents.defaults.sandbox.scope` في **عدد الحاويات** التي يتم إنشاؤها:

- `"agent"` ‏(الافتراضي): حاوية واحدة لكل وكيل.
- `"session"`: حاوية واحدة لكل جلسة.
- `"shared"`: حاوية واحدة مشتركة بين جميع الجلسات المعزولة.

## الواجهة الخلفية

تتحكم `agents.defaults.sandbox.backend` في **وقت التشغيل** الذي يوفّر sandbox:

- `"docker"` ‏(الافتراضي عند تمكين Sandboxing): وقت تشغيل sandbox محلي مدعوم من Docker.
- `"ssh"`: وقت تشغيل sandbox بعيد عام مدعوم بـ SSH.
- `"openshell"`: وقت تشغيل sandbox مدعوم بـ OpenShell.

توجد إعدادات SSH الخاصة ضمن `agents.defaults.sandbox.ssh`.
وتوجد إعدادات OpenShell الخاصة ضمن `plugins.entries.openshell.config`.

### اختيار واجهة خلفية

|                     | Docker                         | SSH                            | OpenShell                                           |
| ------------------- | ------------------------------ | ------------------------------ | --------------------------------------------------- |
| **مكان التشغيل**    | حاوية محلية                    | أي مضيف يمكن الوصول إليه عبر SSH | sandbox مُدارة بواسطة OpenShell                    |
| **الإعداد**         | `scripts/sandbox-setup.sh`     | مفتاح SSH + مضيف الهدف         | تمكين Plugin ‏OpenShell                             |
| **نموذج مساحة العمل** | bind-mount أو نسخ             | بعيد-مرجعي (زرع لمرة واحدة)    | `mirror` أو `remote`                                |
| **التحكم بالشبكة**  | `docker.network` ‏(الافتراضي: none) | يعتمد على المضيف البعيد       | يعتمد على OpenShell                                 |
| **متصفح sandbox**   | مدعوم                          | غير مدعوم                      | غير مدعوم بعد                                       |
| **عمليات bind mount** | `docker.binds`               | لا ينطبق                       | لا ينطبق                                            |
| **الأفضل لـ**       | التطوير المحلي، العزل الكامل  | التفويض إلى جهاز بعيد          | sandboxes بعيدة مُدارة مع مزامنة ثنائية الاتجاه اختيارية |

### واجهة Docker الخلفية

يكون Sandboxing معطّلًا افتراضيًا. وإذا قمت بتمكينه ولم تختر
واجهة خلفية، يستخدم OpenClaw واجهة Docker الخلفية. وهو ينفّذ الأدوات ومتصفحات sandbox
محليًا عبر مقبس Docker daemon ‏(`/var/run/docker.sock`). ويتحدد عزل حاويات sandbox
بواسطة مساحات أسماء Docker.

**قيود Docker-out-of-Docker ‏(DooD)**:
إذا نشرت OpenClaw Gateway نفسها كحاوية Docker، فإنها تنسّق حاويات sandbox شقيقة باستخدام مقبس Docker الخاص بالمضيف (DooD). ويؤدي هذا إلى قيد محدد على تعيين المسارات:

- **تتطلب الإعدادات مسارات المضيف**: يجب أن يحتوي إعداد `workspace` في `openclaw.json` على **المسار المطلق الخاص بالمضيف** (مثل `/home/user/.openclaw/workspaces`) وليس المسار الداخلي لحاوية Gateway. فعندما يطلب OpenClaw من Docker daemon إنشاء sandbox، يقيّم daemon المسارات نسبةً إلى مساحة أسماء نظام تشغيل المضيف، وليس إلى مساحة أسماء Gateway.
- **تماثل جسر نظام الملفات (تعيين Volume متطابق)**: تكتب عملية OpenClaw Gateway الأصلية أيضًا ملفات heartbeat وbridge إلى دليل `workspace`. وبما أن Gateway تقيّم السلسلة النصية الدقيقة نفسها (مسار المضيف) من داخل بيئة الحاوية الخاصة بها، **فيجب** أن يتضمن نشر Gateway تعيين volume مطابقًا يربط مساحة أسماء المضيف مباشرةً (`-v /home/user/.openclaw:/home/user/.openclaw`).

إذا قمت بتعيين المسارات داخليًا من دون تماثل مطلق مع المضيف، فإن OpenClaw ترمي أصلًا خطأ أذونات `EACCES` عند محاولة كتابة heartbeat داخل بيئة الحاوية لأن السلسلة النصية الكاملة للمسار لا توجد أصلًا.

### واجهة SSH الخلفية

استخدم `backend: "ssh"` عندما تريد من OpenClaw عزل `exec`، وأدوات الملفات، وقراءات الوسائط على
أي جهاز يمكن الوصول إليه عبر SSH.

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

كيف يعمل:

- ينشئ OpenClaw جذرًا بعيدًا لكل نطاق ضمن `sandbox.ssh.workspaceRoot`.
- عند أول استخدام بعد الإنشاء أو إعادة الإنشاء، يزرع OpenClaw مساحة العمل البعيدة انطلاقًا من مساحة العمل المحلية مرة واحدة.
- بعد ذلك، تعمل `exec` و`read` و`write` و`edit` و`apply_patch` وقراءات الوسائط وقت المطالبة وتجهيز الوسائط الواردة مباشرةً على مساحة العمل البعيدة عبر SSH.
- لا يقوم OpenClaw بمزامنة التغييرات البعيدة مرة أخرى إلى مساحة العمل المحلية تلقائيًا.

مواد المصادقة:

- `identityFile` و`certificateFile` و`knownHostsFile`: استخدم الملفات المحلية الموجودة ومررها عبر إعداد OpenSSH.
- `identityData` و`certificateData` و`knownHostsData`: استخدم سلاسل مضمنة أو SecretRefs. يقوم OpenClaw بحلها عبر اللقطة العادية لوقت تشغيل الأسرار، ويكتبها إلى ملفات مؤقتة مع `0600`، ثم يحذفها عند انتهاء جلسة SSH.
- إذا تم تعيين كل من `*File` و`*Data` للعنصر نفسه، فإن `*Data` تفوز في تلك الجلسة الخاصة بـ SSH.

هذا نموذج **بعيد-مرجعي**. تصبح مساحة عمل SSH البعيدة هي حالة sandbox الفعلية بعد الزرع الأولي.

نتائج مهمة:

- لا تكون التعديلات المحلية على المضيف، التي تتم خارج OpenClaw بعد خطوة الزرع، مرئية عن بُعد حتى تعيد إنشاء sandbox.
- يقوم `openclaw sandbox recreate` بحذف الجذر البعيد لكل نطاق ثم يزرع من المحلي مرة أخرى عند الاستخدام التالي.
- لا يدعم عزل المتصفح داخل sandbox على واجهة SSH الخلفية.
- لا تنطبق إعدادات `sandbox.docker.*` على واجهة SSH الخلفية.

### واجهة OpenShell الخلفية

استخدم `backend: "openshell"` عندما تريد من OpenClaw عزل الأدوات داخل
بيئة بعيدة مُدارة بواسطة OpenShell. وللاطلاع على دليل الإعداد الكامل، ومرجع
الإعدادات، ومقارنة أوضاع مساحة العمل، راجع صفحة
[OpenShell](/ar/gateway/openshell) المخصصة.

تعيد OpenShell استخدام نقل SSH الأساسي نفسه وجسر نظام الملفات البعيد مثل
واجهة SSH الخلفية العامة، وتضيف دورة حياة خاصة بـ OpenShell
(`sandbox create/get/delete` و`sandbox ssh-config`) بالإضافة إلى وضع مساحة العمل
الاختياري `mirror`.

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

- `mirror` ‏(الافتراضي): تبقى مساحة العمل المحلية هي المرجع الأساسي. ويقوم OpenClaw بمزامنة الملفات المحلية إلى OpenShell قبل exec ويزامن مساحة العمل البعيدة مرة أخرى بعد exec.
- `remote`: تصبح مساحة عمل OpenShell هي المرجع الأساسي بعد إنشاء sandbox. ويزرع OpenClaw مساحة العمل البعيدة مرة واحدة من المحلية، ثم تعمل أدوات الملفات وexec مباشرةً على sandbox البعيدة من دون مزامنة التغييرات مرة أخرى.

تفاصيل النقل البعيد:

- يطلب OpenClaw من OpenShell إعداد SSH خاصًا بـ sandbox عبر `openshell sandbox ssh-config <name>`.
- يكتب core هذا الإعداد إلى ملف مؤقت، ويفتح جلسة SSH، ويعيد استخدام جسر نظام الملفات البعيد نفسه المستخدم مع `backend: "ssh"`.
- في وضع `mirror` فقط تختلف دورة الحياة: مزامنة المحلي إلى البعيد قبل exec، ثم المزامنة عودةً بعد exec.

القيود الحالية لـ OpenShell:

- متصفح sandbox غير مدعوم بعد
- `sandbox.docker.binds` غير مدعوم على واجهة OpenShell الخلفية
- لا تزال مفاتيح وقت التشغيل الخاصة بـ Docker ضمن `sandbox.docker.*` تنطبق فقط على واجهة Docker الخلفية

#### أوضاع مساحة العمل

لدى OpenShell نموذجان لمساحة العمل. وهذا هو الجزء الأكثر أهمية عمليًا.

##### `mirror`

استخدم `plugins.entries.openshell.config.mode: "mirror"` عندما تريد أن تبقى **مساحة العمل المحلية هي المرجع الأساسي**.

السلوك:

- قبل `exec`، يقوم OpenClaw بمزامنة مساحة العمل المحلية إلى sandbox الخاصة بـ OpenShell.
- بعد `exec`، يقوم OpenClaw بمزامنة مساحة العمل البعيدة مرة أخرى إلى مساحة العمل المحلية.
- لا تزال أدوات الملفات تعمل عبر جسر sandbox، لكن مساحة العمل المحلية تظل مصدر الحقيقة بين الأدوار.

استخدم هذا عندما:

- تعدّل الملفات محليًا خارج OpenClaw وتريد أن تظهر هذه التغييرات في sandbox تلقائيًا
- تريد أن تتصرف sandbox الخاصة بـ OpenShell بأكبر قدر ممكن مثل واجهة Docker الخلفية
- تريد أن تعكس مساحة العمل على المضيف عمليات الكتابة داخل sandbox بعد كل دور exec

المقايضة:

- تكلفة مزامنة إضافية قبل exec وبعده

##### `remote`

استخدم `plugins.entries.openshell.config.mode: "remote"` عندما تريد أن تصبح **مساحة العمل الخاصة بـ OpenShell هي المرجع الأساسي**.

السلوك:

- عند إنشاء sandbox للمرة الأولى، يزرع OpenClaw مساحة العمل البعيدة انطلاقًا من مساحة العمل المحلية مرة واحدة.
- بعد ذلك، تعمل `exec` و`read` و`write` و`edit` و`apply_patch` مباشرةً على مساحة العمل البعيدة الخاصة بـ OpenShell.
- لا يقوم OpenClaw **بمزامنة** التغييرات البعيدة مرة أخرى إلى مساحة العمل المحلية بعد exec.
- لا تزال قراءات الوسائط وقت المطالبة تعمل لأن أدوات الملفات والوسائط تقرأ عبر جسر sandbox بدلًا من افتراض مسار مضيف محلي.
- يكون النقل عبر SSH إلى sandbox الخاصة بـ OpenShell المعادة من `openshell sandbox ssh-config`.

نتائج مهمة:

- إذا عدّلت الملفات على المضيف خارج OpenClaw بعد خطوة الزرع، فلن ترى sandbox البعيدة **تلك التغييرات** تلقائيًا.
- إذا أُعيد إنشاء sandbox، فستتم زراعة مساحة العمل البعيدة من مساحة العمل المحلية مرة أخرى.
- مع `scope: "agent"` أو `scope: "shared"`، تكون مساحة العمل البعيدة هذه مشتركة على ذلك النطاق نفسه.

استخدم هذا عندما:

- يجب أن تعيش sandbox أساسًا على الجانب البعيد الخاص بـ OpenShell
- تريد حمل مزامنة أقل لكل دور
- لا تريد أن تؤدي تعديلات المضيف المحلية إلى الكتابة فوق حالة sandbox البعيدة بصمت

اختر `mirror` إذا كنت تنظر إلى sandbox على أنها بيئة تنفيذ مؤقتة.
واختر `remote` إذا كنت تنظر إلى sandbox على أنها مساحة العمل الحقيقية.

#### دورة حياة OpenShell

لا تزال sandboxes الخاصة بـ OpenShell تُدار عبر دورة الحياة العادية لـ sandbox:

- يعرض `openclaw sandbox list` أوقات تشغيل OpenShell بالإضافة إلى أوقات تشغيل Docker
- يحذف `openclaw sandbox recreate` وقت التشغيل الحالي ويجعل OpenClaw يعيد إنشاؤه عند الاستخدام التالي
- كما أن منطق التقليم مدرك للواجهة الخلفية أيضًا

بالنسبة إلى وضع `remote`، تكون إعادة الإنشاء مهمة بشكل خاص:

- تحذف إعادة الإنشاء مساحة العمل البعيدة المرجعية لذلك النطاق
- ويزرع الاستخدام التالي مساحة عمل بعيدة جديدة انطلاقًا من مساحة العمل المحلية

أما في وضع `mirror`، فإن إعادة الإنشاء تعيد أساسًا ضبط بيئة التنفيذ البعيدة
لأن مساحة العمل المحلية تبقى مرجعية في جميع الأحوال.

## وصول مساحة العمل

تتحكم `agents.defaults.sandbox.workspaceAccess` في **ما الذي يمكن لـ sandbox رؤيته**:

- `"none"` ‏(الافتراضي): ترى الأدوات مساحة عمل sandbox ضمن `~/.openclaw/sandboxes`.
- `"ro"`: يحمّل مساحة عمل الوكيل للقراءة فقط عند `/agent` ‏(ويعطّل `write`/`edit`/`apply_patch`).
- `"rw"`: يحمّل مساحة عمل الوكيل للقراءة/الكتابة عند `/workspace`.

مع واجهة OpenShell الخلفية:

- يظل وضع `mirror` يستخدم مساحة العمل المحلية كمصدر مرجعي بين أدوار exec
- يستخدم وضع `remote` مساحة العمل البعيدة الخاصة بـ OpenShell كمصدر مرجعي بعد الزرع الأولي
- لا تزال `workspaceAccess: "ro"` و`"none"` تقيّدان سلوك الكتابة بالطريقة نفسها

يتم نسخ الوسائط الواردة إلى مساحة عمل sandbox النشطة (`media/inbound/*`).
ملاحظة Skills: تكون أداة `read` متجذرة داخل sandbox. ومع `workspaceAccess: "none"`،
يقوم OpenClaw بعكس Skills المؤهلة إلى مساحة عمل sandbox ‏(`.../skills`) بحيث
يمكن قراءتها. ومع `"rw"`، تصبح Skills الخاصة بمساحة العمل قابلة للقراءة من
`/workspace/skills`.

## عمليات bind mount المخصصة

يقوم `agents.defaults.sandbox.docker.binds` بتحميل أدلة إضافية من المضيف داخل الحاوية.
الصيغة: `host:container:mode` ‏(مثل `"/home/user/source:/source:rw"`).

يتم **دمج** bind mounts العامة والخاصة بكل وكيل (وليس استبدالها). وتحت `scope: "shared"`، يتم تجاهل bind mounts الخاصة بكل وكيل.

يقوم `agents.defaults.sandbox.browser.binds` بتحميل أدلة إضافية من المضيف داخل حاوية **متصفح sandbox** فقط.

- عند تعيينه (بما في ذلك `[]`)، فإنه يستبدل `agents.defaults.sandbox.docker.binds` لحاوية المتصفح.
- وعند حذفه، تعود حاوية المتصفح احتياطيًا إلى `agents.defaults.sandbox.docker.binds` ‏(توافق مع الإصدارات السابقة).

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

ملاحظات أمنية:

- تتجاوز bind mounts نظام ملفات sandbox: فهي تكشف مسارات المضيف بالنمط الذي تعيّنه (`:ro` أو `:rw`).
- يحظر OpenClaw مصادر bind الخطرة (مثل: `docker.sock` و`/etc` و`/proc` و`/sys` و`/dev` وعمليات التحميل الأصلية التي قد تكشفها).
- ويحظر OpenClaw أيضًا جذور بيانات الاعتماد الشائعة في الدليل الرئيسي مثل `~/.aws` و`~/.cargo` و`~/.config` و`~/.docker` و`~/.gnupg` و`~/.netrc` و`~/.npm` و`~/.ssh`.
- لا يقتصر التحقق من bind على مطابقة السلاسل النصية. بل يقوم OpenClaw بتطبيع مسار المصدر، ثم يحله مرة أخرى عبر أعمق أصل موجود قبل إعادة التحقق من المسارات المحظورة والجذور المسموح بها.
- وهذا يعني أن محاولات الهروب عبر أصل symlink لا تزال تفشل بشكل مغلق حتى عندما لا تكون الورقة النهائية موجودة بعد. مثال: لا يزال `/workspace/run-link/new-file` يُحل إلى `/var/run/...` إذا كان `run-link` يشير إليه.
- كما تُطبَّع جذور المصادر المسموح بها بالطريقة نفسها، لذلك يُرفَض المسار الذي يبدو فقط داخل allowlist قبل حل symlink على أنه `outside allowed roots`.
- يجب أن تكون عمليات التحميل الحساسة (الأسرار، ومفاتيح SSH، وبيانات اعتماد الخدمات) بنمط `:ro` ما لم يكن ذلك مطلوبًا تمامًا.
- اجمع ذلك مع `workspaceAccess: "ro"` إذا كنت تحتاج فقط إلى وصول للقراءة إلى مساحة العمل؛ وتبقى أنماط bind مستقلة.
- راجع [Sandbox vs Tool Policy vs Elevated](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) لمعرفة كيفية تفاعل bind mounts مع سياسة الأدوات وexec المرتفع.

## الصور + الإعداد

صورة Docker الافتراضية: `openclaw-sandbox:bookworm-slim`

قم ببنائها مرة واحدة:

```bash
scripts/sandbox-setup.sh
```

ملاحظة: لا تتضمن الصورة الافتراضية **Node**. وإذا احتاجت Skill إلى Node ‏(أو
أوقات تشغيل أخرى)، فإما أن تخبز صورة مخصصة أو تثبّت عبر
`sandbox.docker.setupCommand` ‏(يتطلب خروجًا للشبكة + جذرًا قابلًا للكتابة +
مستخدم root).

إذا كنت تريد صورة sandbox أكثر عملية مع أدوات شائعة (مثل
`curl` و`jq` و`nodejs` و`python3` و`git`)، فابنِ:

```bash
scripts/sandbox-common-setup.sh
```

ثم اضبط `agents.defaults.sandbox.docker.image` على
`openclaw-sandbox-common:bookworm-slim`.

صورة متصفح sandbox:

```bash
scripts/sandbox-browser-setup.sh
```

افتراضيًا، تعمل حاويات Docker الخاصة بـ sandbox **من دون شبكة**.
وتجاوز ذلك عبر `agents.defaults.sandbox.docker.network`.

كما تطبّق صورة متصفح sandbox المجمعة افتراضيات محافظة لبدء تشغيل Chromium
لأحمال العمل داخل الحاويات. وتتضمن الافتراضيات الحالية للحاوية ما يلي:

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
- `--no-sandbox` و`--disable-setuid-sandbox` عند تمكين `noSandbox`.
- تكون علامات تقوية الرسوميات الثلاث (`--disable-3d-apis`،
  و`--disable-software-rasterizer`، و`--disable-gpu`) اختيارية، وهي مفيدة
  عندما تفتقر الحاويات إلى دعم GPU. اضبط `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`
  إذا كان حمل العمل لديك يتطلب WebGL أو ميزات متصفح/رسوميات ثلاثية الأبعاد أخرى.
- يتم تمكين `--disable-extensions` افتراضيًا ويمكن تعطيله عبر
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` من أجل التدفقات التي تعتمد على الإضافات.
- يتم التحكم في `--renderer-process-limit=2` عبر
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`، حيث تجعل القيمة `0` Chromium يحتفظ بقيمته الافتراضية.

إذا كنت تحتاج إلى ملف تعريف وقت تشغيل مختلف، فاستخدم صورة متصفح مخصصة ووفّر
نقطة الدخول الخاصة بك. أما بالنسبة إلى ملفات تعريف Chromium المحلية (غير الحاوية)، فاستخدم
`browser.extraArgs` لإلحاق علامات بدء تشغيل إضافية.

الافتراضيات الأمنية:

- يتم حظر `network: "host"`.
- يتم حظر `network: "container:<id>"` افتراضيًا (خطر تجاوز ضم مساحة الأسماء).
- تجاوز الطوارئ: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

توجد تثبيتات Docker وgateway العاملة داخل الحاوية هنا:
[Docker](/ar/install/docker)

بالنسبة إلى عمليات نشر gateway عبر Docker، يمكن لـ `scripts/docker/setup.sh` تهيئة إعدادات sandbox.
اضبط `OPENCLAW_SANDBOX=1` ‏(أو `true`/`yes`/`on`) لتمكين هذا المسار. ويمكنك
تجاوز موقع المقبس عبر `OPENCLAW_DOCKER_SOCKET`. ومرجع الإعداد الكامل وenv:
[Docker](/ar/install/docker#agent-sandbox).

## setupCommand ‏(إعداد الحاوية لمرة واحدة)

يعمل `setupCommand` **مرة واحدة** بعد إنشاء حاوية sandbox ‏(وليس في كل تشغيل).
ويُنفَّذ داخل الحاوية عبر `sh -lc`.

المسارات:

- العام: `agents.defaults.sandbox.docker.setupCommand`
- لكل وكيل: `agents.list[].sandbox.docker.setupCommand`

المشكلات الشائعة:

- تكون `docker.network` الافتراضية هي `"none"` ‏(من دون خروج)، لذلك ستفشل عمليات تثبيت الحزم.
- يتطلب `docker.network: "container:<id>"` القيمة `dangerouslyAllowContainerNamespaceJoin: true` وهو مخصص للطوارئ فقط.
- تمنع `readOnlyRoot: true` عمليات الكتابة؛ اضبط `readOnlyRoot: false` أو اخبز صورة مخصصة.
- يجب أن يكون `user` هو root لتثبيت الحزم (احذف `user` أو اضبط `user: "0:0"`).
- لا يرث Sandbox exec قيمة `process.env` من المضيف. استخدم
  `agents.defaults.sandbox.docker.env` ‏(أو صورة مخصصة) لمفاتيح API الخاصة بـ Skills.

## سياسة الأدوات + مسارات الهروب

تظل سياسات السماح/المنع الخاصة بالأدوات مطبقة قبل قواعد sandbox. وإذا كانت الأداة محظورة
عالميًا أو لكل وكيل، فلن يعيدها Sandboxing.

تمثل `tools.elevated` مسار هروب صريحًا يشغّل `exec` خارج sandbox ‏(`gateway` افتراضيًا، أو `node` عندما يكون هدف exec هو `node`).
ولا تنطبق توجيهات `/exec` إلا على المرسلين المخوّلين وتستمر لكل جلسة؛ ولتعطيل
`exec` بشكل صارم، استخدم منع سياسة الأدوات (راجع [Sandbox vs Tool Policy vs Elevated](/ar/gateway/sandbox-vs-tool-policy-vs-elevated)).

تصحيح الأخطاء:

- استخدم `openclaw sandbox explain` لفحص وضع sandbox الفعلي، وسياسة الأدوات، ومفاتيح الإعدادات الخاصة بالإصلاح.
- راجع [Sandbox vs Tool Policy vs Elevated](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) للحصول على النموذج الذهني لسؤال "لماذا تم حظر هذا؟".
  أبقِه محكمًا.

## تجاوزات متعددة الوكلاء

يمكن لكل وكيل تجاوز sandbox + الأدوات:
`agents.list[].sandbox` و`agents.list[].tools` ‏(بالإضافة إلى `agents.list[].tools.sandbox.tools` لسياسة أدوات sandbox).
راجع [Sandbox والأدوات متعددة الوكلاء](/ar/tools/multi-agent-sandbox-tools) لمعرفة الأولوية.

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

## مستندات ذات صلة

- [OpenShell](/ar/gateway/openshell) -- إعداد الواجهة الخلفية المُدارة لـ sandbox، وأوضاع مساحة العمل، ومرجع الإعدادات
- [إعدادات Sandbox](/ar/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) -- تصحيح سؤال "لماذا تم حظر هذا؟"
- [Sandbox والأدوات متعددة الوكلاء](/ar/tools/multi-agent-sandbox-tools) -- التجاوزات لكل وكيل والأولوية
- [الأمان](/ar/gateway/security)
