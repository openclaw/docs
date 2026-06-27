---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'كيف يعمل عزل OpenClaw: الأوضاع، والنطاقات، والوصول إلى مساحة العمل، والصور'
title: العزل الأمني
x-i18n:
    generated_at: "2026-06-27T17:42:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c9754fbfc71ee5fb48df72eece8ba3b155ce5e0d9c55aae75ce21801dceb07d
    source_path: gateway/sandboxing.md
    workflow: 16
---

يمكن لـ OpenClaw تشغيل **الأدوات داخل خلفيات بيئات معزولة** لتقليل نطاق التأثير. هذا **اختياري** وتتحكم فيه الإعدادات (`agents.defaults.sandbox` أو `agents.list[].sandbox`). إذا كان العزل متوقفًا، تعمل الأدوات على المضيف. يبقى Gateway على المضيف؛ ويعمل تنفيذ الأدوات في بيئة معزولة عند تفعيله.

<Note>
هذا ليس حدًا أمنيًا مثاليًا، لكنه يحد بشكل ملموس من الوصول إلى نظام الملفات والعمليات عندما ينفذ النموذج إجراءً غير مناسب.
</Note>

## ما الذي يُعزل

- تنفيذ الأدوات (`exec`، `read`، `write`، `edit`، `apply_patch`، `process`، إلخ).
- المتصفح المعزول الاختياري (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Sandboxed browser details">
    - افتراضيًا، يبدأ المتصفح المعزول تلقائيًا (لضمان إمكانية الوصول إلى CDP) عندما تحتاج إليه أداة المتصفح. اضبط ذلك عبر `agents.defaults.sandbox.browser.autoStart` و`agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - افتراضيًا، تستخدم حاويات المتصفح المعزول شبكة Docker مخصصة (`openclaw-sandbox-browser`) بدلًا من شبكة `bridge` العامة. اضبط ذلك باستخدام `agents.defaults.sandbox.browser.network`.
    - يقيد الخيار الاختياري `agents.defaults.sandbox.browser.cdpSourceRange` دخول CDP عند حافة الحاوية باستخدام قائمة سماح CIDR (على سبيل المثال `172.21.0.1/32`).
    - وصول مراقب noVNC محمي بكلمة مرور افتراضيًا؛ يصدر OpenClaw عنوان URL برمز قصير العمر يقدّم صفحة تمهيد محلية ويفتح noVNC مع كلمة المرور في جزء عنوان URL (وليس في سجلات الاستعلام/الترويسة).
    - يتيح `agents.defaults.sandbox.browser.allowHostControl` للجلسات المعزولة استهداف متصفح المضيف صراحةً.
    - قوائم السماح الاختيارية تضبط `target: "custom"`: `allowedControlUrls`، و`allowedControlHosts`، و`allowedControlPorts`.

  </Accordion>
</AccordionGroup>

غير معزول:

- عملية Gateway نفسها.
- أي أداة يُسمح لها صراحةً بالعمل خارج البيئة المعزولة (مثل `tools.elevated`).
  - **يتجاوز التنفيذ المرفوع العزل ويستخدم مسار الخروج المضبوط (`gateway` افتراضيًا، أو `node` عندما يكون هدف التنفيذ هو `node`).**
  - إذا كان العزل متوقفًا، فإن `tools.elevated` لا يغير التنفيذ (فهو بالفعل على المضيف). راجع [الوضع المرفوع](/ar/tools/elevated).

## الأوضاع

يتحكم `agents.defaults.sandbox.mode` في **وقت** استخدام العزل:

<Tabs>
  <Tab title="off">
    لا يوجد عزل.
  </Tab>
  <Tab title="non-main">
    اعزل فقط الجلسات **غير الرئيسية** (الافتراضي إذا أردت أن تبقى المحادثات العادية على المضيف).

    يستند `"non-main"` إلى `session.mainKey` (الافتراضي `"main"`)، وليس إلى معرف الوكيل. تستخدم جلسات المجموعة/القناة مفاتيحها الخاصة، لذلك تُعد غير رئيسية وستُعزل.

  </Tab>
  <Tab title="all">
    تعمل كل جلسة داخل بيئة معزولة.
  </Tab>
</Tabs>

## النطاق

يتحكم `agents.defaults.sandbox.scope` في **عدد الحاويات** التي تُنشأ:

- `"agent"` (الافتراضي): حاوية واحدة لكل وكيل.
- `"session"`: حاوية واحدة لكل جلسة.
- `"shared"`: حاوية واحدة مشتركة بين جميع الجلسات المعزولة.

## الخلفية

يتحكم `agents.defaults.sandbox.backend` في **بيئة التشغيل** التي توفر العزل:

- `"docker"` (الافتراضي عند تفعيل العزل): بيئة تشغيل عزل محلية مدعومة بـ Docker.
- `"ssh"`: بيئة تشغيل عزل بعيدة عامة مدعومة بـ SSH.
- `"openshell"`: بيئة تشغيل عزل مدعومة بـ OpenShell.

توجد إعدادات SSH الخاصة تحت `agents.defaults.sandbox.ssh`. وتوجد إعدادات OpenShell الخاصة تحت `plugins.entries.openshell.config`.

### اختيار خلفية

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **مكان التشغيل**   | حاوية محلية                  | أي مضيف يمكن الوصول إليه عبر SSH        | بيئة معزولة مُدارة من OpenShell                           |
| **الإعداد**           | `scripts/sandbox-setup.sh`       | مفتاح SSH + المضيف الهدف          | Plugin OpenShell مفعّل                            |
| **نموذج مساحة العمل** | ربط تحميل أو نسخ               | مرجعي بعيد (بذر مرة واحدة)   | `mirror` أو `remote`                                |
| **التحكم في الشبكة** | `docker.network` (الافتراضي: لا شيء) | يعتمد على المضيف البعيد         | يعتمد على OpenShell                                |
| **عزل المتصفح** | مدعوم                        | غير مدعوم                  | غير مدعوم بعد                                   |
| **ربط التحميلات**     | `docker.binds`                   | N/A                            | N/A                                                 |
| **الأنسب لـ**        | التطوير المحلي، عزل كامل        | نقل الحمل إلى جهاز بعيد | بيئات معزولة بعيدة مُدارة مع مزامنة اختيارية ثنائية الاتجاه |

### خلفية Docker

العزل متوقف افتراضيًا. إذا فعّلت العزل ولم تختر خلفية، يستخدم OpenClaw خلفية Docker. ينفذ الأدوات والمتصفحات المعزولة محليًا عبر مقبس عفريت Docker (`/var/run/docker.sock`). يتحدد عزل حاوية البيئة المعزولة بواسطة نطاقات أسماء Docker.

لإتاحة وحدات GPU الخاصة بالمضيف لبيئات Docker المعزولة، اضبط `agents.defaults.sandbox.docker.gpus` أو تجاوز كل وكيل `agents.list[].sandbox.docker.gpus`. تُمرر القيمة إلى علامة Docker `--gpus` كوسيط منفصل، مثل `"all"` أو `"device=GPU-uuid"`، وتتطلب بيئة تشغيل مضيف متوافقة مثل NVIDIA Container Toolkit.

<Warning>
**قيود Docker-out-of-Docker (DooD)**

إذا نشرت OpenClaw Gateway نفسه كحاوية Docker، فإنه ينسق حاويات بيئة معزولة شقيقة باستخدام مقبس Docker الخاص بالمضيف (DooD). يفرض ذلك قيدًا محددًا على تعيين المسارات:

- **تتطلب الإعدادات مسارات المضيف**: يجب أن تحتوي إعدادات `workspace` في `openclaw.json` على **المسار المطلق للمضيف** (مثل `/home/user/.openclaw/workspaces`)، وليس المسار الداخلي لحاوية Gateway. عندما يطلب OpenClaw من عفريت Docker إنشاء بيئة معزولة، يقيّم العفريت المسارات نسبةً إلى نطاق أسماء نظام تشغيل المضيف، وليس نطاق أسماء Gateway.
- **تكافؤ جسر FS (خريطة وحدات تخزين متطابقة)**: تكتب عملية OpenClaw Gateway الأصلية أيضًا ملفات Heartbeat والجسر إلى دليل `workspace`. لأن Gateway يقيّم السلسلة نفسها تمامًا (مسار المضيف) من داخل بيئته المحوّاة، يجب أن يتضمن نشر Gateway خريطة وحدات تخزين متطابقة تربط نطاق أسماء المضيف أصليًا (`-v /home/user/.openclaw:/home/user/.openclaw`).
- **وضع كود Codex**: عندما تكون بيئة OpenClaw المعزولة نشطة، يعطل OpenClaw وضع الكود الأصلي لخادم تطبيق Codex، وخوادم MCP الخاصة بالمستخدم، وتنفيذ Plugin المدعوم بالتطبيق لذلك الدور لأن هذه الأسطح الأصلية تعمل من عملية خادم تطبيق مضيف Gateway بدلًا من خلفية بيئة OpenClaw المعزولة. يُتاح وصول shell عبر أدوات OpenClaw المدعومة بالبيئة المعزولة مثل `sandbox_exec` و`sandbox_process` عندما تكون أدوات exec/process العادية متاحة. لا تربط مقبس Docker الخاص بالمضيف داخل حاويات بيئة الوكيل المعزولة أو بيئات Codex المعزولة المخصصة.

على مضيفات Ubuntu/AppArmor، قد يفشل Codex `workspace-write` قبل بدء shell
عندما تشغل عمدًا Codex `workspace-write` الأصلي دون عزل OpenClaw نشط
ولا يُسمح لمستخدم الخدمة بإنشاء نطاقات أسماء مستخدمين غير مميزة.
عندما يكون خروج شبكة بيئة Docker المعزولة معطلًا (`network: "none"`،
الافتراضي)، يحتاج Codex أيضًا إلى نطاق أسماء شبكة غير مميز. الأعراض الشائعة هي
`bwrap: setting up uid map: Permission denied` و
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`. شغّل
`openclaw doctor`؛ إذا أبلغ عن فشل فحص نطاق أسماء Codex bwrap، ففضّل
ملف AppArmor يمنح نطاقات الأسماء المطلوبة لعملية خدمة OpenClaw.
`kernel.apparmor_restrict_unprivileged_userns=0` هو بديل على مستوى المضيف
مع مفاضلات أمنية؛ استخدمه فقط عندما يكون وضع ذلك المضيف
مقبولًا.

إذا عينت المسارات داخليًا دون تكافؤ مطلق مع المضيف، يرمي OpenClaw أصليًا خطأ إذن `EACCES` أثناء محاولة كتابة Heartbeat داخل بيئة الحاوية لأن سلسلة المسار المؤهلة بالكامل غير موجودة أصليًا.
</Warning>

### خلفية SSH

استخدم `backend: "ssh"` عندما تريد من OpenClaw عزل `exec`، وأدوات الملفات، وقراءات الوسائط على جهاز عشوائي يمكن الوصول إليه عبر SSH.

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
    - ينشئ OpenClaw جذرًا بعيدًا لكل نطاق تحت `sandbox.ssh.workspaceRoot`.
    - عند أول استخدام بعد الإنشاء أو إعادة الإنشاء، يبذر OpenClaw مساحة العمل البعيدة تلك من مساحة العمل المحلية مرة واحدة.
    - بعد ذلك، تعمل `exec`، و`read`، و`write`، و`edit`، و`apply_patch`، وقراءات وسائط الموجه، وتجهيز الوسائط الواردة مباشرةً على مساحة العمل البعيدة عبر SSH.
    - لا يزامن OpenClaw التغييرات البعيدة تلقائيًا إلى مساحة العمل المحلية.

  </Accordion>
  <Accordion title="Authentication material">
    - `identityFile`، و`certificateFile`، و`knownHostsFile`: استخدم الملفات المحلية الموجودة ومررها عبر إعدادات OpenSSH.
    - `identityData`، و`certificateData`، و`knownHostsData`: استخدم سلاسل مضمنة أو SecretRefs. يحلها OpenClaw عبر لقطة بيئة تشغيل الأسرار العادية، ويكتبها إلى ملفات مؤقتة بصلاحيات `0600`، ويحذفها عندما تنتهي جلسة SSH.
    - إذا ضُبط كل من `*File` و`*Data` للعنصر نفسه، تكون الأولوية لـ `*Data` في جلسة SSH تلك.

  </Accordion>
  <Accordion title="Remote-canonical consequences">
    هذا نموذج **مرجعي بعيد**. تصبح مساحة عمل SSH البعيدة حالة البيئة المعزولة الحقيقية بعد البذر الأولي.

    - التعديلات المحلية على المضيف التي تُجرى خارج OpenClaw بعد خطوة البذر لا تظهر عن بُعد حتى تعيد إنشاء البيئة المعزولة.
    - يحذف `openclaw sandbox recreate` الجذر البعيد لكل نطاق ويعيد البذر من المحلي عند الاستخدام التالي.
    - عزل المتصفح غير مدعوم على خلفية SSH.
    - لا تنطبق إعدادات `sandbox.docker.*` على خلفية SSH.

  </Accordion>
</AccordionGroup>

### خلفية OpenShell

استخدم `backend: "openshell"` عندما تريد من OpenClaw عزل الأدوات في بيئة بعيدة مُدارة من OpenShell. للحصول على دليل الإعداد الكامل، ومرجع الإعدادات، ومقارنة أوضاع مساحة العمل، راجع [صفحة OpenShell المخصصة](/ar/gateway/openshell).

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

- `mirror` (الافتراضي): تبقى مساحة العمل المحلية هي المرجع. يزامن OpenClaw الملفات المحلية إلى OpenShell قبل exec ويزامن مساحة العمل البعيدة مرة أخرى بعد exec.
- `remote`: تكون مساحة عمل OpenShell هي المرجع بعد إنشاء البيئة المعزولة. يبذر OpenClaw مساحة العمل البعيدة مرة واحدة من مساحة العمل المحلية، ثم تعمل أدوات الملفات وexec مباشرةً على البيئة المعزولة البعيدة دون مزامنة التغييرات مرة أخرى.

<AccordionGroup>
  <Accordion title="تفاصيل النقل البعيد">
    - يطلب OpenClaw من OpenShell إعداد SSH خاصًا ببيئة العزل عبر `openshell sandbox ssh-config <name>`.
    - يكتب Core إعداد SSH هذا إلى ملف مؤقت، ويفتح جلسة SSH، ويعيد استخدام جسر نظام الملفات البعيد نفسه المستخدم بواسطة `backend: "ssh"`.
    - في وضع `mirror` يختلف دور الحياة فقط: مزامنة المحلي إلى البعيد قبل exec، ثم المزامنة مرة أخرى بعد exec.

  </Accordion>
  <Accordion title="قيود OpenShell الحالية">
    - متصفح بيئة العزل غير مدعوم بعد
    - `sandbox.docker.binds` غير مدعوم على واجهة OpenShell الخلفية
    - مفاتيح ضبط وقت التشغيل الخاصة بـ Docker ضمن `sandbox.docker.*` ما زالت تنطبق فقط على واجهة Docker الخلفية

  </Accordion>
</AccordionGroup>

#### أوضاع مساحة العمل

لدى OpenShell نموذجان لمساحة العمل. هذا هو الجزء الأكثر أهمية في الممارسة.

<Tabs>
  <Tab title="mirror (المحلي هو المرجعي)">
    استخدم `plugins.entries.openshell.config.mode: "mirror"` عندما تريد أن **تبقى مساحة العمل المحلية مرجعية**.

    السلوك:

    - قبل `exec`، يزامن OpenClaw مساحة العمل المحلية إلى بيئة عزل OpenShell.
    - بعد `exec`، يزامن OpenClaw مساحة العمل البعيدة مرة أخرى إلى مساحة العمل المحلية.
    - تظل أدوات الملفات تعمل عبر جسر بيئة العزل، لكن مساحة العمل المحلية تبقى مصدر الحقيقة بين الأدوار.

    استخدم هذا عندما:

    - تعدل الملفات محليًا خارج OpenClaw وتريد أن تظهر هذه التغييرات في بيئة العزل تلقائيًا
    - تريد أن تتصرف بيئة عزل OpenShell بأقرب شكل ممكن إلى واجهة Docker الخلفية
    - تريد أن تعكس مساحة عمل المضيف كتابات بيئة العزل بعد كل دور exec

    المفاضلة: تكلفة مزامنة إضافية قبل exec وبعده.

  </Tab>
  <Tab title="remote (OpenShell هو المرجعي)">
    استخدم `plugins.entries.openshell.config.mode: "remote"` عندما تريد أن **تصبح مساحة عمل OpenShell مرجعية**.

    السلوك:

    - عند إنشاء بيئة العزل لأول مرة، يهيئ OpenClaw مساحة العمل البعيدة من مساحة العمل المحلية مرة واحدة.
    - بعد ذلك، تعمل `exec` و`read` و`write` و`edit` و`apply_patch` مباشرةً على مساحة عمل OpenShell البعيدة.
    - لا يزامن OpenClaw التغييرات البعيدة مرة أخرى إلى مساحة العمل المحلية بعد exec.
    - تظل قراءات الوسائط وقت الطلب تعمل لأن أدوات الملفات والوسائط تقرأ عبر جسر بيئة العزل بدلًا من افتراض مسار مضيف محلي.
    - النقل هو SSH إلى بيئة عزل OpenShell التي يعيدها `openshell sandbox ssh-config`.

    نتائج مهمة:

    - إذا عدلت ملفات على المضيف خارج OpenClaw بعد خطوة التهيئة، فلن ترى بيئة العزل البعيدة تلك التغييرات تلقائيًا.
    - إذا أُعيد إنشاء بيئة العزل، فستتم تهيئة مساحة العمل البعيدة من مساحة العمل المحلية مرة أخرى.
    - مع `scope: "agent"` أو `scope: "shared"`، تتم مشاركة مساحة العمل البعيدة هذه ضمن النطاق نفسه.

    استخدم هذا عندما:

    - ينبغي أن تعيش بيئة العزل أساسًا على جانب OpenShell البعيد
    - تريد تقليل عبء المزامنة لكل دور
    - لا تريد أن تستبدل تعديلات المضيف المحلية حالة بيئة العزل البعيدة بصمت

  </Tab>
</Tabs>

اختر `mirror` إذا كنت تعتبر بيئة العزل بيئة تنفيذ مؤقتة. اختر `remote` إذا كنت تعتبر بيئة العزل مساحة العمل الحقيقية.

#### دورة حياة OpenShell

ما زالت بيئات عزل OpenShell تدار عبر دورة حياة بيئة العزل العادية:

- يعرض `openclaw sandbox list` أوقات تشغيل OpenShell وكذلك أوقات تشغيل Docker
- يحذف `openclaw sandbox recreate` وقت التشغيل الحالي ويتيح لـ OpenClaw إعادة إنشائه عند الاستخدام التالي
- منطق التنظيف مدرك للواجهة الخلفية أيضًا

بالنسبة إلى وضع `remote`، فإن إعادة الإنشاء مهمة خصوصًا:

- تحذف إعادة الإنشاء مساحة العمل البعيدة المرجعية لذلك النطاق
- يهيئ الاستخدام التالي مساحة عمل بعيدة جديدة من مساحة العمل المحلية

بالنسبة إلى وضع `mirror`، تعيد إعادة الإنشاء أساسًا ضبط بيئة التنفيذ البعيدة لأن مساحة العمل المحلية تبقى مرجعية على أي حال.

## الوصول إلى مساحة العمل

يتحكم `agents.defaults.sandbox.workspaceAccess` في **ما يمكن لبيئة العزل رؤيته**:

<Tabs>
  <Tab title="none (الافتراضي)">
    ترى الأدوات مساحة عمل بيئة عزل ضمن `~/.openclaw/sandboxes`.
  </Tab>
  <Tab title="ro">
    يثبت مساحة عمل الوكيل للقراءة فقط عند `/agent` (يعطل `write`/`edit`/`apply_patch`).
  </Tab>
  <Tab title="rw">
    يثبت مساحة عمل الوكيل للقراءة/الكتابة عند `/workspace`.
  </Tab>
</Tabs>

مع واجهة OpenShell الخلفية:

- ما زال وضع `mirror` يستخدم مساحة العمل المحلية كمصدر مرجعي بين أدوار exec
- يستخدم وضع `remote` مساحة عمل OpenShell البعيدة كمصدر مرجعي بعد التهيئة الأولية
- يظل `workspaceAccess: "ro"` و`"none"` يقيدان سلوك الكتابة بالطريقة نفسها

تُنسخ الوسائط الواردة إلى مساحة عمل بيئة العزل النشطة (`media/inbound/*`).

<Note>
**ملاحظة Skills:** أداة `read` متجذرة في بيئة العزل. مع `workspaceAccess: "none"`، يعكس OpenClaw المهارات المؤهلة إلى مساحة عمل بيئة العزل (`.../skills`) كي يمكن قراءتها. مع `"rw"`، يمكن قراءة Skills مساحة العمل من `/workspace/skills`، وتُجسَّد Skills المؤهلة المدارة أو المضمنة أو التابعة لـ Plugin في مسار القراءة فقط المولد `/workspace/.openclaw/sandbox-skills/skills`.
</Note>

## عمليات تثبيت الربط المخصصة

يثبت `agents.defaults.sandbox.docker.binds` أدلة مضيف إضافية داخل الحاوية. الصيغة: `host:container:mode` (مثل `"/home/user/source:/source:rw"`).

تُدمج عمليات الربط العامة والخاصة بكل وكيل **ولا تُستبدل**. ضمن `scope: "shared"`، يتم تجاهل عمليات الربط الخاصة بكل وكيل.

يثبت `agents.defaults.sandbox.browser.binds` أدلة مضيف إضافية داخل حاوية **متصفح بيئة العزل** فقط.

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

- تتجاوز عمليات الربط نظام ملفات بيئة العزل: فهي تعرض مسارات المضيف بالوضع الذي تضبطه (`:ro` أو `:rw`).
- يحظر OpenClaw مصادر الربط الخطرة (على سبيل المثال: `docker.sock` و`/etc` و`/proc` و`/sys` و`/dev` وعمليات تثبيت الأصل التي قد تعرضها).
- يحظر OpenClaw أيضًا جذور بيانات الاعتماد الشائعة في دليل المنزل مثل `~/.aws` و`~/.cargo` و`~/.config` و`~/.docker` و`~/.gnupg` و`~/.netrc` و`~/.npm` و`~/.ssh`.
- التحقق من الربط ليس مجرد مطابقة نصية. يطبّع OpenClaw مسار المصدر، ثم يحله مرة أخرى عبر أعمق أصل موجود قبل إعادة فحص المسارات المحظورة والجذور المسموح بها.
- يعني ذلك أن عمليات الإفلات عبر أصل رابط رمزي تظل تفشل مغلقة حتى عندما لا تكون الورقة النهائية موجودة بعد. مثال: يظل `/workspace/run-link/new-file` يُحل كـ `/var/run/...` إذا كان `run-link` يشير إلى هناك.
- تُحوَّل جذور المصدر المسموح بها إلى الشكل المرجعي بالطريقة نفسها، لذلك يُرفض المسار الذي يبدو داخل قائمة السماح فقط قبل حل الرابط الرمزي باعتباره `outside allowed roots`.
- ينبغي أن تكون عمليات تثبيت البيانات الحساسة (الأسرار، مفاتيح SSH، بيانات اعتماد الخدمات) `:ro` ما لم تكن مطلوبة تمامًا.
- ادمج ذلك مع `workspaceAccess: "ro"` إذا كنت تحتاج فقط إلى وصول قراءة لمساحة العمل؛ تبقى أوضاع الربط مستقلة.
- راجع [بيئة العزل مقابل سياسة الأدوات مقابل الصلاحيات المرتفعة](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) لمعرفة كيفية تفاعل عمليات الربط مع سياسة الأدوات والتنفيذ المرتفع.

</Warning>

## الصور والإعداد

صورة Docker الافتراضية: `openclaw-sandbox:bookworm-slim`

<Note>
**نسخة مصدرية مقابل تثبيت npm**

لا تتوفر سكربتات المساعدة `scripts/sandbox-setup.sh` و`scripts/sandbox-common-setup.sh` و`scripts/sandbox-browser-setup.sh` إلا عند التشغيل من [نسخة مصدرية](https://github.com/openclaw/openclaw). وهي غير مضمنة في حزمة npm.

إذا ثبت OpenClaw عبر `npm install -g openclaw`، فاستخدم أوامر `docker build` المضمنة المعروضة أدناه بدلًا من ذلك.
</Note>

<Steps>
  <Step title="بناء الصورة الافتراضية">
    من نسخة مصدرية:

    ```bash
    scripts/sandbox-setup.sh
    ```

    من تثبيت npm (لا حاجة إلى نسخة مصدرية):

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

    لا تتضمن الصورة الافتراضية Node. إذا كانت إحدى Skills تحتاج إلى Node (أو أوقات تشغيل أخرى)، فإما أن تخبز صورة مخصصة أو تثبت عبر `sandbox.docker.setupCommand` (يتطلب خروج شبكة + جذرًا قابلًا للكتابة + مستخدم root).

    لا يستبدل OpenClaw بصمت `debian:bookworm-slim` العادي عند فقدان `openclaw-sandbox:bookworm-slim`. تفشل عمليات تشغيل بيئة العزل التي تستهدف الصورة الافتراضية بسرعة مع تعليمات بناء إلى أن تبنيها، لأن الصورة المضمنة تحمل `python3` لمساعدات الكتابة/التحرير داخل بيئة العزل.

  </Step>
  <Step title="اختياري: بناء الصورة المشتركة">
    للحصول على صورة بيئة عزل أكثر وظيفية تتضمن أدوات شائعة (على سبيل المثال `curl` و`jq` وNode 24 وpnpm و`python3` و`git`):

    من نسخة مصدرية:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    من تثبيت npm، ابنِ الصورة الافتراضية أولًا (انظر أعلاه)، ثم ابنِ الصورة المشتركة فوقها باستخدام [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) من المستودع.

    ثم اضبط `agents.defaults.sandbox.docker.image` على `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="اختياري: بناء صورة متصفح بيئة العزل">
    من نسخة مصدرية:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    من تثبيت npm، ابنِ باستخدام [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) من المستودع.

  </Step>
</Steps>

افتراضيًا، تعمل حاويات بيئة عزل Docker **بلا شبكة**. تجاوز ذلك باستخدام `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="إعدادات Chromium الافتراضية لمتصفح بيئة العزل">
    تطبق صورة متصفح بيئة العزل المضمنة أيضًا إعدادات بدء تشغيل Chromium محافظة لأحمال العمل داخل الحاويات. تتضمن الإعدادات الافتراضية الحالية للحاوية:

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
    - `--no-sandbox` عندما يكون `noSandbox` ممكّنًا.
    - أعلام تقوية الرسوميات الثلاثة (`--disable-3d-apis` و`--disable-software-rasterizer` و`--disable-gpu`) اختيارية ومفيدة عندما تفتقر الحاويات إلى دعم GPU. اضبط `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` إذا كان حمل العمل لديك يتطلب WebGL أو ميزات متصفح/ثلاثية الأبعاد أخرى.
    - يتم تمكين `--disable-extensions` افتراضيًا ويمكن تعطيله باستخدام `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` للتدفقات المعتمدة على الإضافات.
    - يتحكم `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` في `--renderer-process-limit=2`، حيث يُبقي `0` إعداد Chromium الافتراضي.

    إذا كنت تحتاج إلى ملف تعريف وقت تشغيل مختلف، فاستخدم صورة متصفح مخصصة ووفر نقطة دخولك الخاصة. بالنسبة إلى ملفات تعريف Chromium المحلية (غير الحاوية)، استخدم `browser.extraArgs` لإلحاق أعلام بدء تشغيل إضافية.

  </Accordion>
  <Accordion title="الإعدادات الافتراضية لأمان الشبكة">
    - يتم حظر `network: "host"`.
    - يتم حظر `network: "container:<id>"` افتراضياً (خطر تجاوز عبر الانضمام إلى namespace).
    - تجاوز الطوارئ: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

توجد تثبيتات Docker وGateway المعبأ في حاوية هنا: [Docker](/ar/install/docker)

بالنسبة إلى عمليات نشر Docker Gateway، يمكن لـ `scripts/docker/setup.sh` تمهيد إعدادات sandbox. عيّن `OPENCLAW_SANDBOX=1` (أو `true`/`yes`/`on`) لتمكين هذا المسار. يمكنك تجاوز موقع المقبس باستخدام `OPENCLAW_DOCKER_SOCKET`. مرجع الإعداد الكامل والبيئة: [Docker](/ar/install/docker#agent-sandbox).

## setupCommand (إعداد الحاوية لمرة واحدة)

يعمل `setupCommand` **مرة واحدة** بعد إنشاء حاوية sandbox (وليس عند كل تشغيل). يتم تنفيذه داخل الحاوية عبر `sh -lc`.

المسارات:

- عام: `agents.defaults.sandbox.docker.setupCommand`
- لكل وكيل: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="المشكلات الشائعة">
    - القيمة الافتراضية لـ `docker.network` هي `"none"` (لا يوجد خروج إلى الشبكة)، لذلك ستفشل تثبيتات الحزم.
    - يتطلب `docker.network: "container:<id>"` ضبط `dangerouslyAllowContainerNamespaceJoin: true` وهو مخصص للطوارئ فقط.
    - يمنع `readOnlyRoot: true` عمليات الكتابة؛ اضبط `readOnlyRoot: false` أو ابنِ صورة مخصصة.
    - يجب أن يكون `user` هو root لتثبيت الحزم (احذف `user` أو اضبط `user: "0:0"`).
    - لا يرث تنفيذ sandbox متغيرات `process.env` الخاصة بالمضيف. استخدم `agents.defaults.sandbox.docker.env` (أو صورة مخصصة) لمفاتيح API الخاصة بـ Skills.
    - تُمرَّر القيم في `agents.defaults.sandbox.docker.env` كمتغيرات بيئة صريحة لحاوية Docker. يمكن لأي شخص لديه وصول إلى Docker daemon فحصها باستخدام أوامر بيانات Docker الوصفية مثل `docker inspect`. استخدم صورة مخصصة، أو ملف أسرار مركباً، أو مساراً آخر لتسليم الأسرار إذا كان هذا الكشف عبر البيانات الوصفية غير مقبول.

  </Accordion>
</AccordionGroup>

## سياسة الأدوات ومخارج التجاوز

تظل سياسات السماح/الرفض للأدوات مطبقة قبل قواعد sandbox. إذا رُفضت أداة عالمياً أو لكل وكيل، فلن يعيدها sandboxing.

`tools.elevated` هو مخرج تجاوز صريح يشغل `exec` خارج sandbox (`gateway` افتراضياً، أو `node` عندما يكون هدف التنفيذ هو `node`). لا تنطبق توجيهات `/exec` إلا على المرسلين المصرح لهم وتستمر لكل جلسة؛ لتعطيل `exec` بشكل صارم، استخدم رفض سياسة الأدوات (راجع [Sandbox مقابل سياسة الأدوات مقابل Elevated](/ar/gateway/sandbox-vs-tool-policy-vs-elevated)).

تصحيح الأخطاء:

- استخدم `openclaw sandbox explain` لفحص وضع sandbox الفعال، وسياسة الأدوات، ومفاتيح إعداد الإصلاح.
- راجع [Sandbox مقابل سياسة الأدوات مقابل Elevated](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) للحصول على النموذج الذهني لسؤال "لماذا تم حظر هذا؟".

أبقِه مقفلاً بإحكام.

## تجاوزات الوكلاء المتعددين

يمكن لكل وكيل تجاوز sandbox + الأدوات: `agents.list[].sandbox` و`agents.list[].tools` (بالإضافة إلى `agents.list[].tools.sandbox.tools` لسياسة أدوات sandbox). راجع [Sandbox والأدوات للوكلاء المتعددين](/ar/tools/multi-agent-sandbox-tools) لمعرفة الأسبقية.

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

- [Sandbox والأدوات للوكلاء المتعددين](/ar/tools/multi-agent-sandbox-tools) — التجاوزات لكل وكيل والأسبقية
- [OpenShell](/ar/gateway/openshell) — إعداد واجهة sandbox الخلفية المُدارة، وأوضاع مساحة العمل، ومرجع الإعدادات
- [إعدادات Sandbox](/ar/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox مقابل سياسة الأدوات مقابل Elevated](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) — تصحيح "لماذا تم حظر هذا؟"
- [الأمان](/ar/gateway/security)
