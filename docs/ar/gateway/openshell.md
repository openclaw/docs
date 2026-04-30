---
read_when:
    - تريد بيئات عزل مُدارة سحابيًا بدلًا من Docker المحلي
    - أنت تقوم بإعداد Plugin OpenShell
    - تحتاج إلى الاختيار بين وضع المرآة ووضع مساحة العمل البعيدة
summary: استخدم OpenShell كواجهة خلفية مُدارة لصندوق العزل لوكلاء OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-04-30T08:01:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 694a0a145802f4b624af01b58cbb5886bab7426fb9a90f216480141082089144
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell هو واجهة خلفية مُدارة لصناديق الحماية في OpenClaw. بدلاً من تشغيل حاويات Docker
محلياً، يفوّض OpenClaw دورة حياة صندوق الحماية إلى CLI الخاص بـ `openshell`،
الذي يوفّر بيئات بعيدة مع تنفيذ أوامر قائم على SSH.

يعيد Plugin OpenShell استخدام نقل SSH الأساسي نفسه وجسر نظام الملفات البعيد
المستخدمين في [واجهة SSH الخلفية](/ar/gateway/sandboxing#ssh-backend) العامة. ويضيف
دورة حياة خاصة بـ OpenShell (`sandbox create/get/delete`، `sandbox ssh-config`)
ووضع مساحة عمل اختياري باسم `mirror`.

## المتطلبات المسبقة

- تثبيت CLI الخاص بـ `openshell` وإتاحته على `PATH` (أو تعيين مسار مخصص عبر
  `plugins.entries.openshell.config.command`)
- حساب OpenShell لديه صلاحية الوصول إلى صناديق الحماية
- تشغيل OpenClaw Gateway على المضيف

## البدء السريع

1. فعّل Plugin واضبط الواجهة الخلفية لصندوق الحماية:

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

2. أعد تشغيل Gateway. في الدور التالي للوكيل، ينشئ OpenClaw صندوق حماية OpenShell
   ويوجّه تنفيذ الأدوات من خلاله.

3. تحقّق:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## أوضاع مساحة العمل

هذا هو القرار الأهم عند استخدام OpenShell.

### `mirror`

استخدم `plugins.entries.openshell.config.mode: "mirror"` عندما تريد أن تبقى **مساحة
العمل المحلية هي المصدر المعتمد**.

السلوك:

- قبل `exec`، يزامن OpenClaw مساحة العمل المحلية إلى صندوق حماية OpenShell.
- بعد `exec`، يزامن OpenClaw مساحة العمل البعيدة مرة أخرى إلى مساحة العمل المحلية.
- تظل أدوات الملفات تعمل عبر جسر صندوق الحماية، لكن مساحة العمل المحلية
  تبقى مصدر الحقيقة بين الأدوار.

الأفضل لـ:

- تحرير الملفات محلياً خارج OpenClaw والرغبة في ظهور تلك التغييرات في
  صندوق الحماية تلقائياً.
- جعل صندوق حماية OpenShell يتصرف بأقرب قدر ممكن إلى واجهة Docker الخلفية.
- عكس كتابات صندوق الحماية في مساحة عمل المضيف بعد كل دور exec.

المفاضلة: تكلفة مزامنة إضافية قبل كل exec وبعده.

### `remote`

استخدم `plugins.entries.openshell.config.mode: "remote"` عندما تريد أن تصبح
**مساحة عمل OpenShell هي المصدر المعتمد**.

السلوك:

- عند إنشاء صندوق الحماية لأول مرة، يملأ OpenClaw مساحة العمل البعيدة من
  مساحة العمل المحلية مرة واحدة.
- بعد ذلك، تعمل `exec` و`read` و`write` و`edit` و`apply_patch`
  مباشرةً على مساحة عمل OpenShell البعيدة.
- لا يزامن OpenClaw التغييرات البعيدة مرة أخرى إلى مساحة العمل المحلية.
- تستمر قراءات الوسائط وقت تكوين الموجه بالعمل لأن أدوات الملفات والوسائط تقرأ عبر
  جسر صندوق الحماية.

الأفضل لـ:

- أن يعيش صندوق الحماية أساساً على الجانب البعيد.
- تقليل عبء المزامنة لكل دور.
- عدم رغبتك في أن تستبدل التعديلات المحلية على المضيف حالة صندوق الحماية البعيد بصمت.

<Warning>
إذا حررت ملفات على المضيف خارج OpenClaw بعد الملء الأولي، فلن يرى صندوق الحماية البعيد تلك التغييرات. استخدم `openclaw sandbox recreate` لإعادة الملء.
</Warning>

### اختيار وضع

|                          | `mirror`                   | `remote`                  |
| ------------------------ | -------------------------- | ------------------------- |
| **مساحة العمل المعتمدة** | المضيف المحلي              | OpenShell البعيد          |
| **اتجاه المزامنة**       | ثنائي الاتجاه (كل exec)    | ملء لمرة واحدة            |
| **العبء لكل دور**        | أعلى (رفع + تنزيل)         | أقل (عمليات بعيدة مباشرة) |
| **هل تظهر التعديلات المحلية؟** | نعم، عند exec التالي       | لا، حتى إعادة الإنشاء     |
| **الأفضل لـ**            | سير عمل التطوير            | الوكلاء طويلو التشغيل، CI |

## مرجع التكوين

توجد كل إعدادات OpenShell ضمن `plugins.entries.openshell.config`:

| المفتاح                  | النوع                    | الافتراضي    | الوصف                                                |
| ------------------------ | ------------------------ | ------------ | ---------------------------------------------------- |
| `mode`                   | `"mirror"` أو `"remote"` | `"mirror"`   | وضع مزامنة مساحة العمل                              |
| `command`                | `string`                 | `"openshell"` | مسار أو اسم CLI الخاص بـ `openshell`                |
| `from`                   | `string`                 | `"openclaw"` | مصدر صندوق الحماية عند الإنشاء لأول مرة             |
| `gateway`                | `string`                 | —            | اسم OpenShell gateway (`--gateway`)                  |
| `gatewayEndpoint`        | `string`                 | —            | عنوان URL لنقطة نهاية OpenShell gateway (`--gateway-endpoint`) |
| `policy`                 | `string`                 | —            | معرّف سياسة OpenShell لإنشاء صندوق الحماية           |
| `providers`              | `string[]`               | `[]`         | أسماء المزوّدين المراد إرفاقها عند إنشاء صندوق الحماية |
| `gpu`                    | `boolean`                | `false`      | طلب موارد GPU                                       |
| `autoProviders`          | `boolean`                | `true`       | تمرير `--auto-providers` أثناء إنشاء صندوق الحماية   |
| `remoteWorkspaceDir`     | `string`                 | `"/sandbox"` | مساحة العمل الأساسية القابلة للكتابة داخل صندوق الحماية |
| `remoteAgentWorkspaceDir` | `string`                | `"/agent"`   | مسار تركيب مساحة عمل الوكيل (للوصول للقراءة فقط)    |
| `timeoutSeconds`         | `number`                 | `120`        | مهلة عمليات CLI الخاص بـ `openshell`                 |

تُضبط إعدادات مستوى صندوق الحماية (`mode` و`scope` و`workspaceAccess`) ضمن
`agents.defaults.sandbox` كما في أي واجهة خلفية. راجع
[صناديق الحماية](/ar/gateway/sandboxing) للاطلاع على المصفوفة الكاملة.

## أمثلة

### إعداد بعيد بسيط

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

بالنسبة إلى وضع `remote`، **تُعد إعادة الإنشاء مهمة بشكل خاص**: فهي تحذف مساحة العمل
البعيدة المعتمدة لذلك النطاق. الاستخدام التالي يملأ مساحة عمل بعيدة جديدة من
مساحة العمل المحلية.

بالنسبة إلى وضع `mirror`، تعيد إعادة الإنشاء أساساً ضبط بيئة التنفيذ البعيدة لأن
مساحة العمل المحلية تظل المصدر المعتمد.

### متى تعيد الإنشاء

أعد الإنشاء بعد تغيير أي مما يلي:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## تقوية الأمان

يثبّت OpenShell واصف ملف جذر مساحة العمل ويعيد فحص هوية صندوق الحماية قبل كل
قراءة، لذلك لا يمكن لتبديلات الروابط الرمزية أو إعادة تركيب مساحة العمل توجيه القراءات خارج
مساحة العمل البعيدة المقصودة.

## القيود الحالية

- متصفح صندوق الحماية غير مدعوم على واجهة OpenShell الخلفية.
- لا ينطبق `sandbox.docker.binds` على OpenShell.
- إعدادات وقت التشغيل الخاصة بـ Docker ضمن `sandbox.docker.*` تنطبق فقط على واجهة Docker
  الخلفية.

## كيف يعمل

1. يستدعي OpenClaw الأمر `openshell sandbox create` (مع الأعلام `--from` و`--gateway`
   و`--policy` و`--providers` و`--gpu` حسب التكوين).
2. يستدعي OpenClaw الأمر `openshell sandbox ssh-config <name>` للحصول على
   تفاصيل اتصال SSH الخاصة بصندوق الحماية.
3. يكتب القلب تكوين SSH إلى ملف مؤقت ويفتح جلسة SSH باستخدام
   جسر نظام الملفات البعيد نفسه المستخدم في واجهة SSH الخلفية العامة.
4. في وضع `mirror`: يزامن المحلي إلى البعيد قبل exec، ثم يشغّل، ثم يزامن مرة أخرى بعد exec.
5. في وضع `remote`: يملأ مرة واحدة عند الإنشاء، ثم يعمل مباشرة على مساحة العمل
   البعيدة.

## ذات صلة

- [صناديق الحماية](/ar/gateway/sandboxing) -- الأوضاع والنطاقات ومقارنة الواجهات الخلفية
- [صندوق الحماية مقابل سياسة الأدوات مقابل الصلاحيات المرتفعة](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) -- تصحيح أخطاء الأدوات المحظورة
- [صندوق الحماية والأدوات متعددة الوكلاء](/ar/tools/multi-agent-sandbox-tools) -- تجاوزات لكل وكيل
- [CLI صندوق الحماية](/ar/cli/sandbox) -- أوامر `openclaw sandbox`
