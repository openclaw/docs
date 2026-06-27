---
read_when:
    - تريد بيئات معزولة مُدارة سحابيًا بدلًا من Docker المحلي
    - أنت بصدد إعداد Plugin OpenShell
    - تحتاج إلى الاختيار بين وضعي مساحة العمل المرآة والبعيدة
summary: استخدم OpenShell كواجهة خلفية مُدارة لبيئة sandbox لوكلاء OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-06-27T17:41:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d278f7550a3178c30a1b42f80495c55bb9827f7785ce9c4d1ee4a57adb3a5e4b
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell هو واجهة خلفية مُدارة لصناديق الحماية في OpenClaw. بدلاً من تشغيل حاويات Docker
محلياً، يفوّض OpenClaw دورة حياة صندوق الحماية إلى CLI `openshell`،
الذي يوفّر بيئات بعيدة مع تنفيذ أوامر قائم على SSH.

يعيد Plugin OpenShell استخدام نقل SSH الأساسي نفسه وجسر نظام الملفات البعيد
مثل [واجهة SSH الخلفية](/ar/gateway/sandboxing#ssh-backend) العامة. ويضيف
دورة حياة خاصة بـ OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`)
ووضع مساحة عمل اختياري باسم `mirror`.

## المتطلبات المسبقة

- تثبيت Plugin OpenShell (`openclaw plugins install @openclaw/openshell-sandbox`)
- تثبيت CLI `openshell` ووجوده على `PATH` (أو تعيين مسار مخصص عبر
  `plugins.entries.openshell.config.command`)
- حساب OpenShell لديه وصول إلى صناديق الحماية
- تشغيل OpenClaw Gateway على المضيف

## البدء السريع

1. ثبّت Plugin وفعّله، ثم اضبط واجهة صندوق الحماية الخلفية:

```bash
openclaw plugins install @openclaw/openshell-sandbox
```

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

2. أعد تشغيل Gateway. عند دور الوكيل التالي، ينشئ OpenClaw صندوق حماية OpenShell
   ويوجّه تنفيذ الأدوات عبره.

3. تحقّق:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## أوضاع مساحة العمل

هذا هو القرار الأهم عند استخدام OpenShell.

### `mirror`

استخدم `plugins.entries.openshell.config.mode: "mirror"` عندما تريد أن تبقى
**مساحة العمل المحلية هي المرجع المعتمد**.

السلوك:

- قبل `exec`، يزامن OpenClaw مساحة العمل المحلية إلى صندوق حماية OpenShell.
- بعد `exec`، يزامن OpenClaw مساحة العمل البعيدة عائداً إلى مساحة العمل المحلية.
- تستمر أدوات الملفات في العمل عبر جسر صندوق الحماية، لكن مساحة العمل المحلية
  تبقى مصدر الحقيقة بين الأدوار.

الأفضل لـ:

- عندما تعدّل الملفات محلياً خارج OpenClaw وتريد أن تظهر تلك التغييرات في
  صندوق الحماية تلقائياً.
- عندما تريد أن يتصرف صندوق حماية OpenShell بأقرب قدر ممكن إلى واجهة Docker الخلفية.
- عندما تريد أن تعكس مساحة عمل المضيف كتابات صندوق الحماية بعد كل دور تنفيذ.

المفاضلة: تكلفة مزامنة إضافية قبل كل تنفيذ وبعده.

### `remote`

استخدم `plugins.entries.openshell.config.mode: "remote"` عندما تريد أن تصبح
**مساحة عمل OpenShell هي المرجع المعتمد**.

السلوك:

- عند إنشاء صندوق الحماية لأول مرة، يملأ OpenClaw مساحة العمل البعيدة من
  مساحة العمل المحلية مرة واحدة.
- بعد ذلك، تعمل `exec` و`read` و`write` و`edit` و`apply_patch`
  مباشرةً على مساحة عمل OpenShell البعيدة.
- لا يزامن OpenClaw التغييرات البعيدة عائدةً إلى مساحة العمل المحلية.
- تستمر قراءات الوسائط وقت المطالبة في العمل لأن أدوات الملفات والوسائط تقرأ عبر
  جسر صندوق الحماية.

الأفضل لـ:

- عندما ينبغي أن يعيش صندوق الحماية أساساً على الجانب البعيد.
- عندما تريد تقليل كلفة المزامنة في كل دور.
- عندما لا تريد أن تستبدل التعديلات المحلية على المضيف حالة صندوق الحماية البعيد بصمت.

<Warning>
إذا عدّلت الملفات على المضيف خارج OpenClaw بعد الملء الأولي، فلن يرى صندوق الحماية البعيد تلك التغييرات. استخدم `openclaw sandbox recreate` لإعادة الملء.
</Warning>

### اختيار وضع

|                          | `mirror`                   | `remote`                  |
| ------------------------ | -------------------------- | ------------------------- |
| **مساحة العمل المعتمدة** | المضيف المحلي             | OpenShell البعيد          |
| **اتجاه المزامنة**       | ثنائي الاتجاه (كل تنفيذ)  | ملء لمرة واحدة            |
| **الكلفة لكل دور**       | أعلى (رفع + تنزيل)        | أقل (عمليات بعيدة مباشرة) |
| **هل تظهر التعديلات المحلية؟** | نعم، عند التنفيذ التالي | لا، حتى إعادة الإنشاء      |
| **الأفضل لـ**            | سير عمل التطوير            | الوكلاء طويلة التشغيل، CI |

## مرجع الإعدادات

توجد كل إعدادات OpenShell ضمن `plugins.entries.openshell.config`:

| المفتاح                  | النوع                    | الافتراضي    | الوصف                                                |
| ------------------------ | ------------------------ | ------------ | ---------------------------------------------------- |
| `mode`                   | `"mirror"` أو `"remote"` | `"mirror"`   | وضع مزامنة مساحة العمل                              |
| `command`                | `string`                 | `"openshell"` | مسار أو اسم CLI `openshell`                         |
| `from`                   | `string`                 | `"openclaw"` | مصدر صندوق الحماية عند الإنشاء لأول مرة             |
| `gateway`                | `string`                 | —            | اسم Gateway في OpenShell (`--gateway`)              |
| `gatewayEndpoint`        | `string`                 | —            | عنوان URL لنقطة نهاية Gateway في OpenShell (`--gateway-endpoint`) |
| `policy`                 | `string`                 | —            | معرّف سياسة OpenShell لإنشاء صندوق الحماية           |
| `providers`              | `string[]`               | `[]`         | أسماء المزوّدين لإرفاقها عند إنشاء صندوق الحماية    |
| `gpu`                    | `boolean`                | `false`      | طلب موارد GPU                                       |
| `autoProviders`          | `boolean`                | `true`       | تمرير `--auto-providers` أثناء إنشاء صندوق الحماية  |
| `remoteWorkspaceDir`     | `string`                 | `"/sandbox"` | مساحة العمل الأساسية القابلة للكتابة داخل صندوق الحماية |
| `remoteAgentWorkspaceDir` | `string`                | `"/agent"`   | مسار تركيب مساحة عمل الوكيل (للوصول للقراءة فقط)   |
| `timeoutSeconds`         | `number`                 | `120`        | مهلة عمليات CLI `openshell`                         |

تُضبط إعدادات مستوى صندوق الحماية (`mode` و`scope` و`workspaceAccess`) ضمن
`agents.defaults.sandbox` كما هو الحال مع أي واجهة خلفية. راجع
[صناديق الحماية](/ar/gateway/sandboxing) للاطلاع على المصفوفة الكاملة.

## أمثلة

### إعداد بعيد بالحد الأدنى

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

### OpenShell لكل وكيل مع Gateway مخصص

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

تُدار صناديق حماية OpenShell عبر CLI صندوق الحماية المعتاد:

```bash
# List all sandbox runtimes (Docker + OpenShell)
openclaw sandbox list

# Inspect effective policy
openclaw sandbox explain

# Recreate (deletes remote workspace, re-seeds on next use)
openclaw sandbox recreate --all
```

في وضع `remote`، تكون **إعادة الإنشاء مهمة بشكل خاص**: فهي تحذف مساحة العمل
البعيدة المعتمدة لذلك النطاق. يملأ الاستخدام التالي مساحة عمل بعيدة جديدة من
مساحة العمل المحلية.

في وضع `mirror`، تعيد إعادة الإنشاء أساساً ضبط بيئة التنفيذ البعيدة لأن
مساحة العمل المحلية تبقى هي المرجع المعتمد.

### متى تعيد الإنشاء

أعد الإنشاء بعد تغيير أي من هذه:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## تعزيز الأمان

يثبّت OpenShell واصف ملف جذر مساحة العمل ويعيد التحقق من هوية صندوق الحماية قبل كل
قراءة، لذلك لا يمكن لاستبدالات الروابط الرمزية أو إعادة تركيب مساحة العمل أن تعيد توجيه القراءات خارج
مساحة العمل البعيدة المقصودة.

## القيود الحالية

- متصفح صندوق الحماية غير مدعوم على واجهة OpenShell الخلفية.
- لا ينطبق `sandbox.docker.binds` على OpenShell.
- تنطبق مفاتيح ضبط وقت التشغيل الخاصة بـ Docker ضمن `sandbox.docker.*` فقط على واجهة Docker
  الخلفية.

## كيف يعمل

1. يستدعي OpenClaw الأمر `openshell sandbox create` (مع علامات `--from` و`--gateway`
   و`--policy` و`--providers` و`--gpu` كما تم ضبطها).
2. يستدعي OpenClaw الأمر `openshell sandbox ssh-config <name>` للحصول على تفاصيل اتصال SSH
   الخاصة بصندوق الحماية.
3. يكتب core إعدادات SSH إلى ملف مؤقت ويفتح جلسة SSH باستخدام
   جسر نظام الملفات البعيد نفسه مثل واجهة SSH الخلفية العامة.
4. في وضع `mirror`: يزامن من المحلي إلى البعيد قبل التنفيذ، ثم يشغّل، ثم يزامن عائداً بعد التنفيذ.
5. في وضع `remote`: يملأ مرة واحدة عند الإنشاء، ثم يعمل مباشرةً على مساحة العمل
   البعيدة.

## ذات صلة

- [صناديق الحماية](/ar/gateway/sandboxing) -- الأوضاع، والنطاقات، ومقارنة الواجهات الخلفية
- [صندوق الحماية مقابل سياسة الأداة مقابل Elevated](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) -- تصحيح أخطاء الأدوات المحظورة
- [صندوق حماية وأدوات متعددة الوكلاء](/ar/tools/multi-agent-sandbox-tools) -- تجاوزات لكل وكيل
- [CLI صندوق الحماية](/ar/cli/sandbox) -- أوامر `openclaw sandbox`
