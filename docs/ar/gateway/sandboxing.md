---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'كيفية عمل العزل في OpenClaw: الأوضاع والنطاقات والوصول إلى مساحة العمل والصور'
title: العزل البرمجي
x-i18n:
    generated_at: "2026-07-12T05:55:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 60d6695c5d8f4e8d3bfb80dd387a50c104dc4e140d5974a66d5a2176594782a4
    source_path: gateway/sandboxing.md
    workflow: 16
---

يمكن لـ OpenClaw تنفيذ الأدوات داخل بيئة خلفية معزولة لتقليل نطاق الضرر. يكون العزل معطّلًا افتراضيًا، ويُتحكَّم فيه عبر `agents.defaults.sandbox` (عام) أو `agents.list[].sandbox` (لكل وكيل). تظل عملية Gateway دائمًا على المضيف؛ ولا ينتقل إلى البيئة المعزولة عند تمكينها سوى تنفيذ الأدوات.

<Note>
لا يشكّل هذا حدًا أمنيًا مثاليًا، لكنه يقيّد بدرجة كبيرة الوصول إلى نظام الملفات والعمليات عندما يقوم النموذج بتصرف غير سليم.
</Note>

## ما الذي يخضع للعزل

- تنفيذ الأدوات: `exec` و`read` و`write` و`edit` و`apply_patch` و`process` وغيرها.
- متصفح البيئة المعزولة الاختياري (`agents.defaults.sandbox.browser`).

ما لا يخضع للعزل:

- عملية Gateway نفسها.
- أي أداة يُسمح لها صراحةً بالعمل خارج البيئة المعزولة عبر `tools.elevated`. يتجاوز التنفيذ بصلاحيات مرتفعة العزل ويعمل على مسار الخروج المضبوط (`gateway` افتراضيًا، أو `node` عندما يكون هدف التنفيذ هو `node`). إذا كان العزل معطّلًا، فلن يغيّر `tools.elevated` شيئًا لأن التنفيذ يعمل بالفعل على المضيف. راجع [وضع الصلاحيات المرتفعة](/ar/tools/elevated).

## الأوضاع والنطاق والبيئة الخلفية

تتحكم ثلاثة إعدادات مستقلة في سلوك العزل:

| الإعداد | المفتاح                           | القيم                        | الافتراضي |
| ------- | --------------------------------- | ---------------------------- | --------- |
| الوضع   | `agents.defaults.sandbox.mode`    | `off`, `non-main`, `all`     | `off`     |
| النطاق  | `agents.defaults.sandbox.scope`   | `agent`, `session`, `shared` | `agent`   |
| البيئة الخلفية | `agents.defaults.sandbox.backend` | `docker`, `ssh`, `openshell` | `docker`  |

يتحكم **الوضع** في وقت تطبيق العزل:

- `off`: لا يوجد عزل.
- `non-main`: اعزل كل جلسة باستثناء الجلسة الرئيسية للوكيل. يكون مفتاح الجلسة الرئيسية دائمًا `agent:<agentId>:main` (أو `global` عندما تكون قيمة `session.scope` هي `"global"`)، ولا يمكن ضبطه. تستخدم جلسات المجموعات/القنوات مفاتيحها الخاصة، لذا تُعد دائمًا غير رئيسية وتخضع للعزل.
- `all`: تعمل كل جلسة داخل بيئة معزولة.

يتحكم **النطاق** في عدد الحاويات/البيئات التي تُنشأ:

- `agent`: حاوية واحدة لكل وكيل.
- `session`: حاوية واحدة لكل جلسة.
- `shared`: حاوية واحدة مشتركة بين جميع الجلسات المعزولة (يتم تجاهل تجاوزات `docker` و`ssh` و`browser` الخاصة بكل وكيل ضمن هذا النطاق).

تتحكم **البيئة الخلفية** في بيئة التشغيل التي تنفّذ الأدوات المعزولة. يوجد الضبط الخاص بـ SSH ضمن `agents.defaults.sandbox.ssh`، ويوجد الضبط الخاص بـ OpenShell ضمن `plugins.entries.openshell.config`.

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **مكان التشغيل**   | حاوية محلية                      | أي مضيف يمكن الوصول إليه عبر SSH | بيئة معزولة مُدارة بواسطة OpenShell                 |
| **الإعداد**         | `scripts/sandbox-setup.sh`       | مفتاح SSH + المضيف الهدف       | تمكين Plugin ‏OpenShell                             |
| **نموذج مساحة العمل** | ربط عبر نقطة تحميل أو نسخ      | النسخة البعيدة هي المرجعية (تهيئة أولية مرة واحدة) | `mirror` أو `remote`                                |
| **التحكم في الشبكة** | `docker.network` (الافتراضي: بلا شبكة) | يعتمد على المضيف البعيد | يعتمد على OpenShell                                |
| **عزل المتصفح**     | مدعوم                            | غير مدعوم                      | غير مدعوم بعد                                       |
| **عمليات الربط**    | `docker.binds`                   | لا ينطبق                       | لا ينطبق                                            |
| **الأنسب لـ**       | التطوير المحلي والعزل الكامل    | نقل الحمل إلى جهاز بعيد        | بيئات معزولة بعيدة مُدارة مع مزامنة ثنائية الاتجاه اختيارية |

## البيئة الخلفية Docker

تكون Docker البيئة الخلفية الافتراضية عند تمكين العزل. وهي تشغّل الأدوات ومتصفحات البيئة المعزولة محليًا عبر مقبس عفريت Docker ‏(`/var/run/docker.sock`)؛ ويأتي العزل من نطاقات أسماء Docker.

الإعدادات الافتراضية: `network: "none"` (لا اتصال صادر)، و`readOnlyRoot: true`، و`capDrop: ["ALL"]`، والصورة `openclaw-sandbox:bookworm-slim`.

لإتاحة وحدات معالجة الرسومات على المضيف، اضبط `agents.defaults.sandbox.docker.gpus` (أو التجاوز الخاص بكل وكيل) على قيمة مثل `"all"` أو `"device=GPU-uuid"`. تُمرَّر هذه القيمة إلى علامة Docker‏ `--gpus` وتتطلب بيئة تشغيل مضيف متوافقة مثل NVIDIA Container Toolkit.

<Warning>
**قيود Docker خارج Docker ‏(DooD)**

إذا نشرت Gateway الخاص بـ OpenClaw نفسه كحاوية Docker، فإنه ينسّق حاويات العزل الشقيقة باستخدام مقبس Docker الخاص بالمضيف (DooD). يفرض ذلك قيدًا على تعيين المسارات:

- **يتطلب الضبط مسارات المضيف**: يجب أن يحتوي `workspace` في `openclaw.json` على **المسار المطلق للمضيف** (مثل `/home/user/.openclaw/workspaces`)، وليس المسار الداخلي لحاوية Gateway. يقيّم عفريت Docker المسارات بالنسبة إلى نطاق أسماء نظام تشغيل المضيف، وليس نطاق أسماء Gateway نفسه.
- **يلزم تعيين وحدة تخزين مطابق**: تكتب عملية Gateway أيضًا ملفات Heartbeat والجسر في مسار `workspace` هذا. امنح حاوية Gateway تعيين وحدة تخزين مطابقًا (`-v /home/user/.openclaw:/home/user/.openclaw`) لكي يُحل مسار المضيف نفسه بصورة صحيحة من داخل حاوية Gateway أيضًا. تظهر التعيينات غير المتطابقة كخطأ `EACCES` عندما يحاول Gateway كتابة Heartbeat الخاص به.
- **وضع شيفرة Codex**: عندما تكون بيئة OpenClaw المعزولة نشطة، يعطّل OpenClaw وضع الشيفرة الأصلي لخادم تطبيق Codex، وخوادم MCP الخاصة بالمستخدم، وتنفيذ Plugin المدعوم بالتطبيق في تلك الجولة (إذ تعمل هذه من عملية خادم التطبيق الموجودة على مضيف Gateway، لا من البيئة الخلفية المعزولة لـ OpenClaw)، ما لم تكشف سياسة أدوات البيئة المعزولة الأدوات المطلوبة وتفعّل مسار خادم التنفيذ التجريبي للبيئة المعزولة. عندئذٍ يُوجَّه الوصول إلى الصدفة عبر أدوات OpenClaw المدعومة بالبيئة المعزولة، مثل `sandbox_exec` و`sandbox_process`. لا تربط مقبس Docker الخاص بالمضيف داخل حاويات عزل الوكلاء أو بيئات Codex المعزولة المخصصة. راجع [حاضنة Codex](/ar/plugins/codex-harness) للاطلاع على السلوك الكامل.

على مضيفي Ubuntu/AppArmor مع تمكين وضع عزل Docker، يحتاج تنفيذ الصدفة `workspace-write` في خادم تطبيق Codex إلى نطاقات أسماء مستخدمين بلا امتيازات داخل حاوية العزل، وقد يفشل ذلك قبل بدء تشغيل الصدفة عندما يتعذر على مستخدم الخدمة إنشاؤها. ويتطلب ذلك أيضًا نطاق أسماء شبكة بلا امتيازات عندما يكون الاتصال الصادر لعزل Docker معطّلًا (`network: "none"`، وهو الإعداد الافتراضي). تشمل الأعراض الشائعة: `bwrap: setting up uid map: Permission denied` و`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`. شغّل `openclaw doctor`؛ وإذا أبلغ عن فشل فحص نطاق أسماء bwrap الخاص بـ Codex، ففضّل ملف تعريف AppArmor يمنح نطاقات الأسماء المطلوبة لعملية خدمة OpenClaw. يُعد `kernel.apparmor_restrict_unprivileged_userns=0` حلًا احتياطيًا على مستوى المضيف كله مع تنازلات أمنية؛ فلا تستخدمه إلا عندما يكون هذا الوضع الأمني للمضيف مقبولًا.
</Warning>

### المتصفح المعزول

- يبدأ متصفح البيئة المعزولة تلقائيًا (لضمان إمكانية الوصول إلى CDP) عندما تحتاج إليه أداة المتصفح. اضبطه عبر `agents.defaults.sandbox.browser.autoStart` (الافتراضي `true`) و`autoStartTimeoutMs` (الافتراضي 12 ثانية).
- تستخدم حاويات متصفح البيئة المعزولة شبكة Docker مخصصة (`openclaw-sandbox-browser`) بدلًا من شبكة `bridge` العامة. اضبطها عبر `agents.defaults.sandbox.browser.network`.
- يقيّد `agents.defaults.sandbox.browser.cdpSourceRange` دخول CDP عند حافة الحاوية بواسطة قائمة سماح CIDR (مثل `172.21.0.1/32`).
- تكون إمكانية وصول المراقب عبر noVNC محمية بكلمة مرور افتراضيًا؛ يصدر OpenClaw عنوان URL برمز قصير العمر يعرض صفحة تمهيد محلية ويفتح noVNC مع كلمة المرور في جزء URL (وليس في سلسلة الاستعلام أو سجلات الترويسات).
- يسمح `agents.defaults.sandbox.browser.allowHostControl` (الافتراضي `false`) للجلسات المعزولة باستهداف متصفح المضيف صراحةً.
- تتحكم قوائم السماح الاختيارية في `target: "custom"`:‏ `allowedControlUrls` و`allowedControlHosts` و`allowedControlPorts`.

## البيئة الخلفية SSH

استخدم `backend: "ssh"` لعزل `exec` وأدوات الملفات وقراءة الوسائط على أي جهاز يمكن الوصول إليه عبر SSH.

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

الإعدادات الافتراضية: `command: "ssh"` و`workspaceRoot: "/tmp/openclaw-sandboxes"` و`strictHostKeyChecking: true` و`updateHostKeys: true`.

- **دورة الحياة**: ينشئ OpenClaw جذرًا بعيدًا لكل نطاق ضمن `sandbox.ssh.workspaceRoot`. عند أول استخدام بعد الإنشاء أو إعادة الإنشاء، يهيّئ مساحة العمل البعيدة هذه مرة واحدة من مساحة العمل المحلية. بعد ذلك، تعمل `exec` و`read` و`write` و`edit` و`apply_patch` وقراءة وسائط المطالبة وتجهيز الوسائط الواردة مباشرةً على مساحة العمل البعيدة عبر SSH. لا يزامن OpenClaw التغييرات البعيدة تلقائيًا إلى مساحة العمل المحلية.
- **مواد المصادقة**: تشير `identityFile` و`certificateFile` و`knownHostsFile` إلى ملفات محلية موجودة. تقبل `identityData` و`certificateData` و`knownHostsData` سلاسل مضمنة أو SecretRefs، ويجري حلها عبر لقطة بيئة تشغيل الأسرار العادية، ثم تُكتب في ملفات مؤقتة بالوضع `0600` وتُحذف عند انتهاء جلسة SSH. إذا ضُبط متغير من نوع `*File` وآخر من نوع `*Data` للعنصر نفسه، تكون الأولوية لـ `*Data` في تلك الجلسة.
- **نتائج اعتبار النسخة البعيدة مرجعية**: تصبح مساحة عمل SSH البعيدة حالة العزل الفعلية بعد التهيئة الأولية. لا تظهر التعديلات المحلية على المضيف التي تتم خارج OpenClaw بعد خطوة التهيئة في البيئة البعيدة حتى تعيد إنشاء البيئة المعزولة. يحذف `openclaw sandbox recreate` الجذر البعيد الخاص بالنطاق ويعيد تهيئته من النسخة المحلية عند الاستخدام التالي. لا يدعم هذا النظام الخلفي عزل المتصفح، ولا تنطبق عليه إعدادات `sandbox.docker.*`.

## البيئة الخلفية OpenShell

استخدم `backend: "openshell"` لعزل الأدوات في بيئة بعيدة يديرها OpenShell. يعيد OpenShell استخدام نقل SSH وجسر نظام الملفات البعيد نفسيهما اللذين تستخدمهما البيئة الخلفية العامة SSH، ويضيف دورة حياة OpenShell ‏(`sandbox create/get/delete/ssh-config`) بالإضافة إلى وضع مزامنة مساحة العمل الاختياري `mirror`.

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
        },
      },
    },
  },
}
```

يبقي `mode: "mirror"` (الافتراضي) مساحة العمل المحلية مرجعية: يزامن OpenClaw النسخة المحلية إلى البيئة المعزولة قبل `exec` ويعيد المزامنة منها بعده. أما `mode: "remote"` فيهيّئ مساحة العمل البعيدة مرة واحدة من النسخة المحلية، ثم يشغّل `exec` و`read` و`write` و`edit` و`apply_patch` مباشرةً على مساحة العمل البعيدة دون مزامنة عكسية؛ ولا تظهر التعديلات المحلية بعد التهيئة حتى تنفّذ `openclaw sandbox recreate`. ضمن `scope: "agent"` أو `scope: "shared"`، تكون مساحة العمل البعيدة هذه مشتركة على النطاق نفسه. القيود الحالية: متصفح البيئة المعزولة غير مدعوم بعد، ولا ينطبق `sandbox.docker.binds` على هذه البيئة الخلفية.

تتعامل أوامر `openclaw sandbox list` و`recreate` و`prune` جميعها مع بيئات تشغيل OpenShell بالطريقة نفسها التي تتعامل بها مع بيئات تشغيل Docker؛ ويكون منطق التنظيف مدركًا للبيئة الخلفية.

للاطلاع على المتطلبات الأساسية الكاملة ومرجع الضبط ومقارنة أوضاع مساحة العمل وتفاصيل دورة الحياة، راجع [OpenShell](/ar/gateway/openshell).

## الوصول إلى مساحة العمل

يتحكم `agents.defaults.sandbox.workspaceAccess` فيما يمكن للبيئة المعزولة رؤيته:

| القيمة           | السلوك                                                                                                      |
| ---------------- | ----------------------------------------------------------------------------------------------------------- |
| `none` (افتراضي) | ترى الأدوات مساحة عمل معزولة لصندوق الحماية ضمن `~/.openclaw/sandboxes`.                                    |
| `ro`             | تُركّب مساحة عمل الوكيل للقراءة فقط في `/agent` (ما يعطّل `write` و`edit` و`apply_patch`).                   |
| `rw`             | تُركّب مساحة عمل الوكيل للقراءة والكتابة في `/workspace`.                                                    |

مع الواجهة الخلفية OpenShell، يظل وضع `mirror` يستخدم مساحة العمل المحلية بوصفها المصدر المعتمد بين أدوار التنفيذ، بينما يستخدم وضع `remote` مساحة عمل OpenShell البعيدة بوصفها المصدر المعتمد بعد التهيئة الأولية، ويظل `workspaceAccess: "ro"` أو `"none"` يقيّد سلوك الكتابة بالطريقة نفسها.

تُنسخ الوسائط الواردة إلى مساحة عمل صندوق الحماية النشط (`media/inbound/*`).

<Note>
**Skills**: تعمل أداة `read` انطلاقًا من جذر صندوق الحماية. عند استخدام `workspaceAccess: "none"`، يعكس OpenClaw المهارات المؤهلة إلى مساحة عمل صندوق الحماية (`.../skills`) لتصبح قابلة للقراءة. وعند استخدام `"rw"`، يمكن قراءة مهارات مساحة العمل من `/workspace/skills`، وتُنشأ المهارات المؤهلة المُدارة أو المضمّنة أو التابعة لإضافة ضمن المسار المُنشأ المخصص للقراءة فقط `/workspace/.openclaw/sandbox-skills/skills`.
</Note>

## عمليات ربط مخصصة

يركّب `agents.defaults.sandbox.docker.binds` أدلة إضافية من المضيف داخل الحاوية. الصيغة: `host:container:mode` (مثل `"/home/user/source:/source:rw"`).

تُدمج عمليات الربط العامة والخاصة بكل وكيل (ولا يُستبدل بعضها ببعض). ضمن `scope: "shared"`، تُتجاهل عمليات الربط الخاصة بكل وكيل.

يركّب `agents.defaults.sandbox.browser.binds` أدلة إضافية من المضيف داخل حاوية **متصفح صندوق الحماية** فقط. عند تعيينه (بما في ذلك `[]`)، فإنه يستبدل `docker.binds` لحاوية المتصفح؛ وعند حذفه، تعود حاوية المتصفح إلى استخدام `docker.binds`.

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
**أمان عمليات الربط**

- تتجاوز عمليات الربط نظام ملفات صندوق الحماية: فهي تكشف مسارات المضيف بالوضع الذي تحدده (`:ro` أو `:rw`).
- يحظر OpenClaw افتراضيًا مصادر الربط الخطرة: مسارات النظام (`/etc` و`/proc` و`/sys` و`/dev` و`/root` و`/boot`)، وأدلة مقبس Docker (`/run` و`/var/run` ومتغيرات `docker.sock` التابعة لها)، وجذور بيانات الاعتماد الشائعة في الدليل الرئيسي (`~/.aws` و`~/.cargo` و`~/.config` و`~/.docker` و`~/.gnupg` و`~/.netrc` و`~/.npm` و`~/.ssh`).
- توحّد عملية التحقق مسار المصدر، ثم تحلّه مجددًا عبر أعمق سلف موجود قبل إعادة فحص المسارات المحظورة والجذور المسموح بها، لذلك تُرفض محاولات الهروب عبر أصل رابط رمزي تلقائيًا حتى إذا لم تكن الورقة النهائية موجودة بعد (فمثلًا يظل `/workspace/run-link/new-file` يُحل إلى `/var/run/...` إذا كان `run-link` يشير إليه).
- تُحظر افتراضيًا أيضًا أهداف الربط التي تحجب نقاط التركيب المحجوزة في الحاوية (`/workspace` و`/agent`)؛ ويمكن تجاوز ذلك باستخدام `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets: true`.
- تُحظر افتراضيًا مصادر الربط الواقعة خارج الجذور المدرجة في قائمة السماح لمساحة العمل أو مساحة عمل الوكيل؛ ويمكن تجاوز ذلك باستخدام `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources: true`. تُوحّد الجذور المسموح بها بالطريقة نفسها، لذلك يظل المسار الذي يبدو داخل قائمة السماح فقط قبل حل الروابط الرمزية مرفوضًا بوصفه خارج الجذور المسموح بها.
- ينبغي أن تكون عمليات تركيب البيانات الحساسة (الأسرار ومفاتيح SSH وبيانات اعتماد الخدمات) بالوضع `:ro` ما لم تكن الكتابة مطلوبة حتمًا.
- ادمج ذلك مع `workspaceAccess: "ro"` إذا كنت تحتاج فقط إلى صلاحية قراءة مساحة العمل؛ تظل أوضاع الربط مستقلة.
- راجع [صندوق الحماية مقابل سياسة الأدوات مقابل التنفيذ بصلاحيات مرتفعة](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) لمعرفة كيفية تفاعل عمليات الربط مع سياسة الأدوات والتنفيذ بصلاحيات مرتفعة.

</Warning>

## الصور والإعداد

صورة Docker الافتراضية: `openclaw-sandbox:bookworm-slim`

<Note>
**نسخة المصدر مقابل تثبيت npm**

لا تتوفر نصوص المساعدة `scripts/sandbox-setup.sh` و`scripts/sandbox-common-setup.sh` و`scripts/sandbox-browser-setup.sh` إلا عند التشغيل من [نسخة من المصدر](https://github.com/openclaw/openclaw). وهي غير مضمنة في حزمة npm.

إذا ثبّتَّ OpenClaw عبر `npm install -g openclaw`، فاستخدم أوامر `docker build` المضمنة الموضحة أدناه بدلًا منها.
</Note>

<Steps>
  <Step title="إنشاء الصورة الافتراضية">
    من نسخة من المصدر:

    ```bash
    scripts/sandbox-setup.sh
    ```

    من تثبيت npm (لا حاجة إلى نسخة من المصدر):

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

    لا تتضمن الصورة الافتراضية Node. إذا احتاجت إحدى المهارات إلى Node (أو بيئات تشغيل أخرى)، فأنشئ صورة مخصصة تتضمنها أو ثبّتها عبر `sandbox.docker.setupCommand` (يتطلب خروجًا إلى الشبكة وجذرًا قابلًا للكتابة ومستخدمًا جذرًا).

    لا يستبدل OpenClaw الصورة المفقودة `openclaw-sandbox:bookworm-slim` تلقائيًا بالصورة العادية `debian:bookworm-slim`. تفشل عمليات صندوق الحماية التي تستهدف الصورة الافتراضية سريعًا مع تعليمات للإنشاء إلى أن تنشئها، لأن الصورة المضمّنة تحتوي على `python3` لمساعدات الكتابة والتحرير في صندوق الحماية.

  </Step>
  <Step title="اختياري: إنشاء الصورة المشتركة">
    للحصول على صورة صندوق حماية أكثر اكتمالًا وتحتوي على أدوات شائعة (مثل `curl` و`jq` وNode 24 وpnpm و`python3` و`git`):

    من نسخة من المصدر:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    من تثبيت npm، أنشئ الصورة الافتراضية أولًا (راجع ما سبق)، ثم أنشئ الصورة المشتركة فوقها باستخدام [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) من المستودع.

    ثم عيّن `agents.defaults.sandbox.docker.image` إلى `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="اختياري: إنشاء صورة متصفح صندوق الحماية">
    من نسخة من المصدر:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    من تثبيت npm، أنشئ الصورة باستخدام [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) من المستودع.

  </Step>
</Steps>

تعمل حاويات صندوق حماية Docker افتراضيًا **من دون شبكة**. ويمكن تجاوز ذلك باستخدام `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="إعدادات Chromium الافتراضية لمتصفح صندوق الحماية">
    تطبّق صورة متصفح صندوق الحماية المضمّنة علامات تشغيل محافظة لـ Chromium لأحمال العمل داخل الحاويات:

    - `--remote-debugging-address=127.0.0.1`
    - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
    - `--user-data-dir=${HOME}/.chrome`
    - `--no-first-run`
    - `--no-default-browser-check`
    - `--disable-dev-shm-usage`
    - `--disable-background-networking`
    - `--disable-breakpad`
    - `--disable-crash-reporter`
    - `--no-zygote`
    - `--metrics-recording-only`
    - `--password-store=basic`
    - `--use-mock-keychain`
    - `--headless=new` عند تمكين `browser.headless`.
    - `--no-sandbox --disable-setuid-sandbox` عند تمكين `browser.noSandbox`.
    - `--disable-3d-apis` و`--disable-gpu` و`--disable-software-rasterizer` افتراضيًا؛ تساعد علامات تعزيز أمان الرسومات هذه الحاويات التي لا تدعم وحدة معالجة الرسومات. عيّن `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` إذا كان حمل العمل يحتاج إلى WebGL أو ميزات ثلاثية الأبعاد أخرى.
    - `--disable-extensions` افتراضيًا؛ عيّن `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` للمسارات التي تعتمد على الامتدادات.
    - `--renderer-process-limit=2` افتراضيًا؛ يتحكم فيه `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`، حيث تُبقي القيمة `0` إعداد Chromium الافتراضي.

    إذا كنت تحتاج إلى ملف تعريف تشغيل مختلف، فاستخدم صورة متصفح مخصصة ووفّر نقطة الدخول الخاصة بك. بالنسبة إلى ملفات تعريف Chromium المحلية (خارج الحاوية)، استخدم `browser.extraArgs` لإلحاق علامات تشغيل إضافية.

  </Accordion>
  <Accordion title="إعدادات أمان الشبكة الافتراضية">
    - يُحظر `network: "host"`.
    - يُحظر `network: "container:<id>"` افتراضيًا (بسبب خطر تجاوز العزل عبر الانضمام إلى نطاق الأسماء).
    - تجاوز للطوارئ: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

توجد عمليات تثبيت Docker وGateway العامل داخل الحاوية هنا: [Docker](/ar/install/docker)

بالنسبة إلى عمليات نشر Gateway عبر Docker، يمكن لـ `scripts/docker/setup.sh` تهيئة إعدادات صندوق الحماية. عيّن `OPENCLAW_SANDBOX=1` (أو `true` أو `yes` أو `on`) لتمكين هذا المسار. ويمكن تجاوز موقع المقبس باستخدام `OPENCLAW_DOCKER_SOCKET`. مرجع الإعداد الكامل ومتغيرات البيئة: [Docker](/ar/install/docker#agent-sandbox).

## setupCommand (إعداد الحاوية لمرة واحدة)

يعمل `setupCommand` **مرة واحدة** بعد إنشاء حاوية صندوق الحماية (وليس عند كل تشغيل). ويُنفّذ داخل الحاوية عبر `sh -lc`.

المسارات:

- عام: `agents.defaults.sandbox.docker.setupCommand`
- خاص بكل وكيل: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="الأخطاء الشائعة">
    - القيمة الافتراضية لـ `docker.network` هي `"none"` (من دون اتصال خارجي)، لذلك ستفشل عمليات تثبيت الحزم.
    - يتطلب `docker.network: "container:<id>"` تعيين `dangerouslyAllowContainerNamespaceJoin: true`، وهو مخصص للطوارئ فقط.
    - يمنع `readOnlyRoot: true` عمليات الكتابة؛ عيّن `readOnlyRoot: false` أو أنشئ صورة مخصصة.
    - يجب أن يكون `user` هو المستخدم الجذر لتثبيت الحزم (احذف `user` أو عيّن `user: "0:0"`).
    - لا يرث تنفيذ صندوق الحماية `process.env` الخاص بالمضيف. استخدم `agents.defaults.sandbox.docker.env` (أو صورة مخصصة) لمفاتيح API الخاصة بالمهارات.
    - تُمرر القيم الموجودة في `agents.defaults.sandbox.docker.env` بوصفها متغيرات بيئة صريحة لحاوية Docker. ويمكن لأي شخص لديه صلاحية الوصول إلى برنامج Docker الخفي فحصها باستخدام أوامر بيانات Docker الوصفية مثل `docker inspect`. استخدم صورة مخصصة أو ملف أسرار مركّبًا أو مسارًا آخر لتسليم الأسرار إذا كان هذا الكشف عبر البيانات الوصفية غير مقبول.

  </Accordion>
</AccordionGroup>

## سياسة الأدوات ومنافذ الهروب

تظل سياسات السماح بالأدوات أو منعها سارية قبل قواعد صندوق الحماية. إذا كانت أداة ممنوعة عمومًا أو لوكيل بعينه، فلن يعيدها صندوق الحماية.

يمثل `tools.elevated` منفذ هروب صريحًا يشغّل `exec` خارج صندوق الحماية (`gateway` افتراضيًا، أو `node` عندما يكون هدف التنفيذ هو `node`). لا تنطبق توجيهات `/exec` إلا على المرسلين المصرح لهم وتستمر لكل جلسة؛ ولتعطيل `exec` نهائيًا، استخدم المنع في سياسة الأدوات (راجع [صندوق الحماية مقابل سياسة الأدوات مقابل التنفيذ بصلاحيات مرتفعة](/ar/gateway/sandbox-vs-tool-policy-vs-elevated)).

استكشاف الأخطاء وإصلاحها:

- يعرض `openclaw sandbox list` حاويات صندوق الحماية وحالتها ومدى تطابق الصورة وعمرها ومدة خمولها والجلسة أو الوكيل المرتبط بها.
- يفحص `openclaw sandbox explain [--session <key>] [--agent <id>]` وضع صندوق الحماية الفعلي ومساحة عمل المضيف ودليل عمل وقت التشغيل وعمليات تركيب Docker وسياسة الأدوات ومفاتيح الإعداد اللازمة للإصلاح. يظل الحقل `workspaceRoot` فيه هو جذر صندوق الحماية المُعدّ؛ بينما يوضح `effectiveHostWorkspaceRoot` المكان الفعلي لمساحة العمل النشطة.
- يزيل `openclaw sandbox recreate [--all | --session <key> | --agent <id>] [--browser] [--force]` الحاويات أو البيئات كي يُعاد إنشاؤها بالإعدادات الحالية عند الاستخدام التالي.
- راجع [صندوق الحماية مقابل سياسة الأدوات مقابل التنفيذ بصلاحيات مرتفعة](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) للنموذج الذهني الذي يجيب عن سؤال «لماذا هذا محظور؟».

## تجاوزات الوكلاء المتعددين

يمكن لكل وكيل تجاوز إعدادات صندوق الحماية والأدوات: `agents.list[].sandbox` و`agents.list[].tools` (بالإضافة إلى `agents.list[].tools.sandbox.tools` لسياسة أدوات صندوق الحماية). راجع [صندوق حماية وأدوات الوكلاء المتعددين](/ar/tools/multi-agent-sandbox-tools) لمعرفة ترتيب الأولوية.

## مثال مبسط للتمكين

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

- [صندوق الحماية متعدد الوكلاء والأدوات](/ar/tools/multi-agent-sandbox-tools) -- التجاوزات لكل وكيل وترتيب الأولوية
- [OpenShell](/ar/gateway/openshell) -- إعداد الواجهة الخلفية المُدارة لصندوق الحماية، وأوضاع مساحة العمل، ومرجع الإعدادات
- [إعداد صندوق الحماية](/ar/gateway/config-agents#agentsdefaultssandbox)
- [صندوق الحماية مقابل سياسة الأدوات مقابل الصلاحيات المرتفعة](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) -- تصحيح مشكلة «لماذا تم حظر هذا؟»
- [الأمان](/ar/gateway/security)
