---
read_when:
    - تريد بيئات معزولة مُدارة سحابيًا بدلًا من Docker المحلي
    - أنت بصدد إعداد Plugin ‏OpenShell
    - عليك الاختيار بين وضعَي مساحة العمل المعكوسة والبعيدة
summary: استخدم OpenShell كواجهة خلفية مُدارة لصندوق الحماية لوكلاء OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-07-12T05:57:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bf5c33912bd0db759a01cf58ea26712a8ada68c0804bf16f69f1f7cdd496828c
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell هي واجهة خلفية مُدارة لبيئة معزولة: فبدلًا من تشغيل حاويات Docker
محليًا، يفوّض OpenClaw دورة حياة البيئة المعزولة إلى CLI ‏`openshell`، الذي
يوفّر بيئات بعيدة وينفّذ الأوامر عبر SSH.

يعيد Plugin استخدام آلية نقل SSH نفسها وجسر نظام الملفات البعيد نفسيهما كما في
[واجهة SSH الخلفية العامة](/ar/gateway/sandboxing#ssh-backend)، ويضيف دورة حياة OpenShell
‏(`sandbox create/get/delete/ssh-config`) بالإضافة إلى وضع مزامنة اختياري لمساحة العمل
باسم `mirror`.

## المتطلبات الأساسية

- تثبيت Plugin ‏OpenShell ‏(`openclaw plugins install @openclaw/openshell-sandbox`)
- توفر CLI ‏`openshell` ضمن `PATH` (أو تحديد مسار مخصّص عبر
  `plugins.entries.openshell.config.command`)
- حساب OpenShell لديه صلاحية الوصول إلى البيئات المعزولة
- تشغيل OpenClaw Gateway على المضيف

## البدء السريع

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

أعد تشغيل Gateway. في دورة الوكيل التالية، ينشئ OpenClaw بيئة OpenShell
معزولة ويوجّه تنفيذ الأدوات عبرها. تحقّق باستخدام:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## أوضاع مساحة العمل

هذا هو أهم قرار عند استخدام OpenShell.

### mirror (الافتراضي)

يحافظ `plugins.entries.openshell.config.mode: "mirror"` على أن تكون **مساحة العمل
المحلية هي المرجع الأساسي**:

- قبل `exec`، يزامن OpenClaw مساحة العمل المحلية إلى البيئة المعزولة.
- بعد `exec`، يزامن OpenClaw مساحة العمل البعيدة إلى البيئة المحلية.
- تمر أدوات الملفات عبر جسر البيئة المعزولة، لكن البيئة المحلية تظل مصدر الحقيقة
  بين الدورات.

هذا الوضع هو الأنسب لسير عمل التطوير: تظهر التعديلات المحلية التي تُجرى خارج OpenClaw
عند تنفيذ `exec` التالي، وتتصرف البيئة المعزولة بطريقة مشابهة لواجهة Docker الخلفية.

المقابل: تكلفة الرفع والتنزيل عند كل دورة تنفيذ.

### remote

يجعل `mode: "remote"` **مساحة عمل OpenShell هي المرجع الأساسي**:

- عند إنشاء البيئة المعزولة لأول مرة، ينسخ OpenClaw مساحة العمل المحلية إلى المساحة
  البعيدة مرة واحدة.
- بعد ذلك، تعمل `exec` و`read` و`write` و`edit` و`apply_patch`
  مباشرةً على مساحة العمل البعيدة. ولا يزامن OpenClaw التغييرات البعيدة
  إلى البيئة المحلية.
- تظل قراءة الوسائط في وقت إنشاء الموجّه متاحة (تقرأ أدوات الملفات والوسائط عبر
  جسر البيئة المعزولة).

هذا الوضع هو الأنسب للوكلاء طويلي التشغيل وبيئات CI: إذ يخفّض الحمل الإضافي لكل دورة،
ولا يمكن للتعديلات المحلية على المضيف أن تستبدل الحالة البعيدة بصمت.

<Warning>
لن تكون التعديلات التي تُجرى على ملفات المضيف خارج OpenClaw بعد النسخ الأولي مرئية للبيئة المعزولة البعيدة. شغّل `openclaw sandbox recreate` لإعادة النسخ الأولي.
</Warning>

### اختيار الوضع

|                           | `mirror`                         | `remote`                         |
| ------------------------- | -------------------------------- | -------------------------------- |
| **مساحة العمل الأساسية**  | المضيف المحلي                    | OpenShell البعيد                 |
| **اتجاه المزامنة**        | ثنائي الاتجاه (عند كل تنفيذ)     | نسخ أولي لمرة واحدة              |
| **الحمل الإضافي لكل دورة** | أعلى (رفع وتنزيل)                 | أقل (عمليات بعيدة مباشرة)        |
| **هل تظهر التعديلات المحلية؟** | نعم، عند التنفيذ التالي       | لا، حتى إعادة الإنشاء            |
| **الأنسب لـ**              | سير عمل التطوير                   | الوكلاء طويلي التشغيل وبيئات CI  |

## مرجع الإعدادات

توجد جميع إعدادات OpenShell ضمن `plugins.entries.openshell.config`:

| المفتاح                   | النوع                    | القيمة الافتراضية | الوصف                                                                                 |
| ------------------------- | ------------------------ | ------------------ | ------------------------------------------------------------------------------------- |
| `mode`                    | `"mirror"` أو `"remote"` | `"mirror"`         | وضع مزامنة مساحة العمل                                                               |
| `command`                 | `string`                 | `"openshell"`      | مسار CLI ‏`openshell` أو اسمه                                                         |
| `from`                    | `string`                 | `"openclaw"`       | مصدر البيئة المعزولة عند الإنشاء لأول مرة                                             |
| `gateway`                 | `string`                 | غير معيّن          | اسم OpenShell Gateway ‏(`--gateway` في المستوى الأعلى)                                |
| `gatewayEndpoint`         | `string`                 | غير معيّن          | نقطة نهاية OpenShell Gateway ‏(`--gateway-endpoint` في المستوى الأعلى)                |
| `policy`                  | `string`                 | غير معيّن          | معرّف سياسة OpenShell لإنشاء البيئة المعزولة                                          |
| `providers`               | `string[]`               | `[]`               | أسماء المزوّدين المرفقة عند إنشاء البيئة المعزولة (بعد إزالة التكرار، بعلامة `--provider` واحدة لكل مُدخل) |
| `gpu`                     | `boolean`                | `false`            | طلب موارد GPU ‏(`--gpu`)                                                              |
| `autoProviders`           | `boolean`                | `true`             | تمرير `--auto-providers` (أو `--no-auto-providers` عندما تكون القيمة `false`) أثناء الإنشاء |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`       | مساحة العمل الأساسية القابلة للكتابة داخل البيئة المعزولة                            |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`         | مسار تركيب مساحة عمل الوكيل (للقراءة فقط عندما لا تكون صلاحية مساحة العمل `rw`)       |
| `timeoutSeconds`          | `number`                 | `120`              | المهلة الزمنية لعمليات CLI ‏`openshell`                                                |

يجب أن يكون `remoteWorkspaceDir` و`remoteAgentWorkspaceDir` مسارين مطلقين وأن
يبقيا ضمن الجذرين المُدارين `/sandbox` أو `/agent`؛ وتُرفض المسارات المطلقة الأخرى.

توجد إعدادات مستوى البيئة المعزولة (`mode` و`scope` و`workspaceAccess`) ضمن
`agents.defaults.sandbox` كما هو الحال مع أي واجهة خلفية. راجع
[العزل](/ar/gateway/sandboxing) للاطلاع على المصفوفة الكاملة.

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

### وضع النسخ المتطابق مع GPU

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

### OpenShell لكل وكيل مع Gateway مخصّص

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

```bash
# List all sandbox runtimes (Docker + OpenShell)
openclaw sandbox list

# Inspect effective policy
openclaw sandbox explain

# Recreate (deletes remote workspace, re-seeds on next use)
openclaw sandbox recreate --all
```

في وضع `remote`، تكون إعادة الإنشاء مهمة بصفة خاصة: فهي تحذف مساحة العمل البعيدة
الأساسية لذلك النطاق، وينسخ الاستخدام التالي مساحة جديدة من البيئة المحلية.
أما في وضع `mirror`، فتعيد عملية الإنشاء أساسًا ضبط بيئة التنفيذ البعيدة
لأن البيئة المحلية تظل المرجع الأساسي.

أعد الإنشاء بعد تغيير أي مما يلي:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

## تعزيز الأمان

يثبّت جسر نظام الملفات في وضع النسخ المتطابق جذر مساحة العمل المحلية، ويعيد التحقق
من المسارات الأساسية (عبر realpath) قبل كل عملية قراءة وكتابة وإنشاء دليل وإزالة
وإعادة تسمية، مع رفض الروابط الرمزية الواقعة في منتصف المسار. ولا يمكن لتبديل رابط
رمزي أو إعادة تركيب مساحة العمل إعادة توجيه الوصول إلى الملفات خارج الشجرة المنسوخة.

## القيود الحالية

- متصفح البيئة المعزولة غير مدعوم في واجهة OpenShell الخلفية.
- لا ينطبق `sandbox.docker.binds` على OpenShell؛ ويفشل إنشاء البيئة المعزولة
  إذا جرى إعداد عمليات ربط.
- لا تنطبق خيارات وقت التشغيل الخاصة بـ Docker ضمن `sandbox.docker.*` (باستثناء `env`)
  إلا على واجهة Docker الخلفية.

## آلية العمل

1. يشغّل OpenClaw الأمر `sandbox get` لاسم البيئة المعزولة (مع أي من
   `--gateway` أو `--gateway-endpoint` جرى إعداده)؛ وإذا فشل ذلك، ينشئ بيئة باستخدام
   `sandbox create`، مع تمرير `--name` و`--from` و`--policy` عند تعيينها، و`--gpu`
   عند تمكينه، و`--auto-providers` أو `--no-auto-providers`، وعلامة
   `--provider` واحدة لكل مزوّد جرى إعداده.
2. يشغّل OpenClaw الأمر `sandbox ssh-config` لاسم البيئة المعزولة لجلب
   تفاصيل اتصال SSH.
3. يكتب النظام الأساسي إعدادات SSH في ملف مؤقت ويفتح جلسة SSH عبر
   جسر نظام الملفات البعيد نفسه المستخدم في واجهة SSH الخلفية العامة.
4. في وضع `mirror`: يزامن البيئة المحلية إلى البعيدة قبل التنفيذ، ثم ينفّذ، ثم يزامنها عكسيًا بعده.
5. في وضع `remote`: ينسخ مساحة العمل مرة واحدة عند الإنشاء، ثم يعمل مباشرةً على
   مساحة العمل البعيدة.

## موضوعات ذات صلة

- [العزل](/ar/gateway/sandboxing) - الأوضاع والنطاقات ومقارنة الواجهات الخلفية
- [البيئة المعزولة مقابل سياسة الأدوات مقابل الصلاحيات المرتفعة](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) - تصحيح أخطاء الأدوات المحظورة
- [البيئة المعزولة والأدوات متعددة الوكلاء](/ar/tools/multi-agent-sandbox-tools) - تجاوزات الإعداد لكل وكيل
- [CLI للبيئة المعزولة](/ar/cli/sandbox) - أوامر `openclaw sandbox`
