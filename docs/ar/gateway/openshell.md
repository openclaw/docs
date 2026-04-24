---
read_when:
    - تريد sandboxes مُدارة سحابيًا بدلًا من Docker المحلي
    - أنت تقوم بإعداد Plugin ‏OpenShell
    - تحتاج إلى الاختيار بين وضعي mirror workspace وremote workspace
summary: استخدام OpenShell كواجهة خلفية مُدارة لـ sandbox لوكلاء OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-04-24T07:42:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47954cd27b4c7ef9d4268597c2846960b39b99fd03ece5dddb5055e9282366a0
    source_path: gateway/openshell.md
    workflow: 15
---

OpenShell هي واجهة خلفية مُدارة لـ sandbox في OpenClaw. فبدلًا من تشغيل حاويات Docker
محليًا، يفوض OpenClaw دورة حياة sandbox إلى CLI الخاص بـ `openshell`،
الذي يوفّر بيئات بعيدة مع تنفيذ أوامر قائم على SSH.

يعيد Plugin ‏OpenShell استخدام نقل SSH الأساسي نفسه وجسر نظام الملفات البعيد
المستخدم في [واجهة SSH الخلفية](/ar/gateway/sandboxing#ssh-backend) العامة. ويضيف
دورة حياة خاصة بـ OpenShell ‏(`sandbox create/get/delete` و`sandbox ssh-config`)
ووضع مساحة عمل اختياريًا `mirror`.

## المتطلبات المسبقة

- تثبيت CLI الخاص بـ `openshell` ووجوده على `PATH` (أو تعيين مسار مخصص عبر
  `plugins.entries.openshell.config.command`)
- حساب OpenShell لديه وصول إلى sandbox
- تشغيل OpenClaw Gateway على المضيف

## البدء السريع

1. فعّل Plugin واضبط واجهة sandbox الخلفية:

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
          mode: "remote",
        },
      },
    },
  },
}
```

2. أعد تشغيل Gateway. في دورة الوكيل التالية، ينشئ OpenClaw
   sandbox من OpenShell ويوجه تنفيذ الأدوات عبرها.

3. تحقّق:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## أوضاع مساحة العمل

هذا هو القرار الأهم عند استخدام OpenShell.

### `mirror`

استخدم `plugins.entries.openshell.config.mode: "mirror"` عندما تريد أن تبقى **مساحة العمل المحلية هي المرجع الأساسي**.

السلوك:

- قبل `exec`، يقوم OpenClaw بمزامنة مساحة العمل المحلية إلى sandbox الخاصة بـ OpenShell.
- بعد `exec`، يقوم OpenClaw بمزامنة مساحة العمل البعيدة مرة أخرى إلى مساحة العمل المحلية.
- لا تزال أدوات الملفات تعمل عبر جسر sandbox، لكن مساحة العمل المحلية
  تظل مصدر الحقيقة بين الأدوار.

الأفضل لـ:

- عندما تعدّل الملفات محليًا خارج OpenClaw وتريد أن تكون هذه التغييرات مرئية في
  sandbox تلقائيًا.
- عندما تريد أن تتصرف sandbox الخاصة بـ OpenShell بأكبر قدر ممكن مثل واجهة Docker الخلفية.
- عندما تريد أن تعكس مساحة العمل على المضيف عمليات الكتابة في sandbox بعد كل دور exec.

المقايضة: تكلفة مزامنة إضافية قبل كل exec وبعده.

### `remote`

استخدم `plugins.entries.openshell.config.mode: "remote"` عندما تريد أن تصبح **مساحة العمل الخاصة بـ OpenShell هي المرجع الأساسي**.

السلوك:

- عند إنشاء sandbox للمرة الأولى، يزرع OpenClaw مساحة العمل البعيدة انطلاقًا
  من مساحة العمل المحلية مرة واحدة.
- بعد ذلك، تعمل `exec` و`read` و`write` و`edit` و`apply_patch`
  مباشرةً على مساحة العمل البعيدة الخاصة بـ OpenShell.
- لا يقوم OpenClaw **بمزامنة** التغييرات البعيدة مرة أخرى إلى مساحة العمل المحلية.
- لا تزال قراءات الوسائط وقت المطالبة تعمل لأن أدوات الملفات والوسائط تقرأ عبر
  جسر sandbox.

الأفضل لـ:

- عندما يجب أن تعيش sandbox أساسًا على الجانب البعيد.
- عندما تريد حمل مزامنة أقل لكل دور.
- عندما لا تريد أن تؤدي تعديلات المضيف المحلية إلى الكتابة فوق حالة sandbox البعيدة بصمت.

مهم: إذا عدّلت الملفات على المضيف خارج OpenClaw بعد الزرع الأولي،
فلن ترى sandbox البعيدة هذه التغييرات. استخدم
`openclaw sandbox recreate` لإعادة الزرع.

### اختيار الوضع

|                          | `mirror`                  | `remote`                 |
| ------------------------ | ------------------------- | ------------------------ |
| **مساحة العمل المرجعية** | المضيف المحلي             | OpenShell البعيد         |
| **اتجاه المزامنة**       | ثنائي الاتجاه (كل exec)   | زرع لمرة واحدة           |
| **الحمل لكل دور**        | أعلى (رفع + تنزيل)        | أقل (عمليات بعيدة مباشرة) |
| **هل التعديلات المحلية مرئية؟** | نعم، في exec التالي       | لا، حتى recreate         |
| **الأفضل لـ**            | تدفقات عمل التطوير        | الوكلاء طويلو التشغيل، وCI |

## مرجع الإعدادات

توجد جميع إعدادات OpenShell ضمن `plugins.entries.openshell.config`:

| المفتاح                    | النوع                     | الافتراضي    | الوصف                                               |
| -------------------------- | ------------------------ | ------------ | --------------------------------------------------- |
| `mode`                     | `"mirror"` أو `"remote"` | `"mirror"`   | وضع مزامنة مساحة العمل                              |
| `command`                  | `string`                 | `"openshell"`| مسار أو اسم CLI الخاص بـ `openshell`                |
| `from`                     | `string`                 | `"openclaw"` | مصدر sandbox لأول عملية إنشاء                       |
| `gateway`                  | `string`                 | —            | اسم OpenShell gateway ‏(`--gateway`)                |
| `gatewayEndpoint`          | `string`                 | —            | عنوان URL لنقطة نهاية OpenShell gateway ‏(`--gateway-endpoint`) |
| `policy`                   | `string`                 | —            | معرّف سياسة OpenShell لإنشاء sandbox                |
| `providers`                | `string[]`               | `[]`         | أسماء الموفّرين المطلوب إرفاقها عند إنشاء sandbox  |
| `gpu`                      | `boolean`                | `false`      | طلب موارد GPU                                       |
| `autoProviders`            | `boolean`                | `true`       | تمرير `--auto-providers` أثناء إنشاء sandbox        |
| `remoteWorkspaceDir`       | `string`                 | `"/sandbox"` | مساحة العمل الأساسية القابلة للكتابة داخل sandbox   |
| `remoteAgentWorkspaceDir`  | `string`                 | `"/agent"`   | مسار تحميل مساحة عمل الوكيل (للوصول للقراءة فقط)    |
| `timeoutSeconds`           | `number`                 | `120`        | مهلة عمليات CLI الخاصة بـ `openshell`               |

تُضبط الإعدادات على مستوى sandbox ‏(`mode` و`scope` و`workspaceAccess`) ضمن
`agents.defaults.sandbox` كما هو الحال مع أي واجهة خلفية. راجع
[Sandboxing](/ar/gateway/sandboxing) للحصول على المصفوفة الكاملة.

## أمثلة

### إعداد remote بسيط

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

### وضع Mirror مع GPU

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "agent",
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
          mode: "mirror",
          gpu: true,
          providers: ["openai"],
          timeoutSeconds: 180,
        },
      },
    },
  },
}
```

### OpenShell لكل وكيل مع gateway مخصص

```json5
{
  agents: {
    defaults: {
      sandbox: { mode: "off" },
    },
    list: [
      {
        id: "researcher",
        sandbox: {
          mode: "all",
          backend: "openshell",
          scope: "agent",
          workspaceAccess: "rw",
        },
      },
    ],
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
          gateway: "lab",
          gatewayEndpoint: "https://lab.example",
          policy: "strict",
        },
      },
    },
  },
}
```

## إدارة دورة الحياة

تُدار sandboxes الخاصة بـ OpenShell عبر CLI العادي الخاص بـ sandbox:

```bash
# سرد جميع أوقات تشغيل sandbox ‏(Docker + OpenShell)
openclaw sandbox list

# فحص السياسة الفعلية
openclaw sandbox explain

# إعادة الإنشاء (يحذف مساحة العمل البعيدة، ويعيد زرعها عند الاستخدام التالي)
openclaw sandbox recreate --all
```

بالنسبة إلى وضع `remote`، تكون **إعادة الإنشاء مهمة بشكل خاص**: إذ تحذف
مساحة العمل البعيدة المرجعية لهذا النطاق. وعند الاستخدام التالي يتم زرع
مساحة عمل بعيدة جديدة انطلاقًا من مساحة العمل المحلية.

أما بالنسبة إلى وضع `mirror`، فتعيد إعادة الإنشاء أساسًا ضبط بيئة التنفيذ البعيدة لأن
مساحة العمل المحلية تظل هي المرجع الأساسي.

### متى تعيد الإنشاء

أعد الإنشاء بعد تغيير أيٍّ مما يلي:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## التقوية الأمنية

يثبّت OpenShell واصف ملف جذر مساحة العمل ويعيد التحقق من هوية sandbox قبل كل
قراءة، بحيث لا تتمكن عمليات تبديل symlink أو إعادة تحميل مساحة العمل من إعادة توجيه القراءات
خارج مساحة العمل البعيدة المقصودة.

## القيود الحالية

- متصفح sandbox غير مدعوم على واجهة OpenShell الخلفية.
- لا ينطبق `sandbox.docker.binds` على OpenShell.
- تنطبق مفاتيح وقت التشغيل الخاصة بـ Docker ضمن `sandbox.docker.*` على واجهة Docker
  الخلفية فقط.

## كيف يعمل

1. يستدعي OpenClaw الأمر `openshell sandbox create` ‏(مع الوسائط `--from` و`--gateway`،
   و`--policy` و`--providers` و`--gpu` بحسب الإعداد).
2. يستدعي OpenClaw الأمر `openshell sandbox ssh-config <name>` للحصول على
   تفاصيل اتصال SSH الخاصة بـ sandbox.
3. يكتب core إعداد SSH إلى ملف مؤقت ويفتح جلسة SSH باستخدام
   جسر نظام الملفات البعيد نفسه المستخدم في واجهة SSH الخلفية العامة.
4. في وضع `mirror`: تتم مزامنة المحلي إلى البعيد قبل exec، ثم التشغيل، ثم المزامنة
   عودةً بعد exec.
5. في وضع `remote`: تتم الزراعة مرة واحدة عند الإنشاء، ثم التشغيل مباشرةً على
   مساحة العمل البعيدة.

## ذو صلة

- [Sandboxing](/ar/gateway/sandboxing) -- الأوضاع، والنطاقات، ومقارنة الواجهات الخلفية
- [Sandbox vs Tool Policy vs Elevated](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) -- تصحيح الأدوات المحظورة
- [Sandbox والأدوات متعددة الوكلاء](/ar/tools/multi-agent-sandbox-tools) -- تجاوزات لكل وكيل
- [CLI الخاص بـ Sandbox](/ar/cli/sandbox) -- أوامر `openclaw sandbox`
