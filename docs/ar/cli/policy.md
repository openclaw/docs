---
read_when:
    - تريد التحقق من إعدادات OpenClaw بمقارنتها بملف policy.jsonc مُعَدّ مسبقًا
    - تريد نتائج السياسات في تدقيق doctor
    - تحتاج إلى تجزئة إقرار بالسياسة لتقديم دليل التدقيق
summary: مرجع CLI لفحوصات التوافق مع `openclaw policy`
title: السياسة
x-i18n:
    generated_at: "2026-07-12T05:43:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 280f9ed1e741786f85dfed978690eb18a03c8fbde20e0d01e31a9d215ae0a128
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

يوفّر Plugin السياسة المضمّن الأمر `openclaw policy`. وهو طبقة امتثال مؤسسية تعمل فوق إعدادات OpenClaw الحالية، وليس نظام تهيئة ثانٍ. تكتب المتطلبات في `policy.jsonc`؛ ويراقب OpenClaw مساحة العمل النشطة بوصفها أدلة؛ وتُبلغ السياسة عن الانحراف عبر `doctor --lint`. لا تفرض السياسة استدعاءات الأدوات ولا تعيد كتابة سلوك وقت التشغيل عند معالجة الطلب، كما أنها لا تصادق على مخازن بيانات الاعتماد الخاصة بكل وكيل مثل `auth-profiles.json`.

تتحقق السياسة من القنوات المهيأة، وخوادم MCP، وموفّري النماذج، ووضع حماية الشبكة من SSRF، والوصول الوارد/الوصول إلى القنوات، وتعرّض Gateway ووضع أوامر Node، ووصول الوكلاء إلى مساحة العمل، ووضع العزل، ووضع معالجة البيانات، ووضع موفّري الأسرار/ملفات تعريف المصادقة، والبيانات الوصفية للأدوات الخاضعة للحوكمة (`TOOLS.md`). استخدمها عندما تحتاج مساحة العمل إلى بيان دائم وقابل للتحقق، مثل «يجب ألّا يكون Telegram مفعّلًا» أو «يجب أن تصرّح الأدوات الخاضعة للحوكمة ببيانات وصفية للمخاطر والمالك». إذا كنت تحتاج فقط إلى سلوك محلي دون مصادقة أو اكتشاف للانحراف، فتكفي التهيئة العادية.

## البدء السريع

```bash
openclaw plugins enable policy
```

يظل Plugin مفعّلًا حتى عند غياب `policy.jsonc`، لكي يتمكن أمر doctor من الإبلاغ عن العنصر المفقود بدلًا من تخطي عمليات التحقق بصمت.

أنشئ `policy.jsonc` يدويًا؛ فهو لا يُولّد من الإعدادات الحالية. يمثّل كل قسم من المستوى الأعلى نطاق أسماء للقواعد: لا يعمل التحقق إلا عند وجود قاعدة محددة تحته (تفشل الأقسام أو المفاتيح غير المدعومة بالرمز `policy/policy-jsonc-invalid` بدلًا من تجاهلها بصمت). فيما يلي مثال أدنى يغطي كل قسم مدعوم:

```jsonc
{
  "channels": {
    "denyRules": [
      {
        "id": "no-telegram",
        "when": { "provider": "telegram" },
        "reason": "Telegram is not approved for this workspace.",
      },
    ],
  },
  "mcp": {
    "servers": {
      "allow": ["docs"],
      "deny": ["untrusted"],
    },
  },
  "models": {
    "providers": {
      "allow": ["openai", "anthropic"],
      "deny": ["openrouter"],
    },
  },
  "network": {
    "privateNetwork": {
      "allow": false,
    },
  },
  "ingress": {
    "session": {
      "requireDmScope": "per-channel-peer",
    },
    "channels": {
      "allowDmPolicies": ["pairing", "allowlist", "disabled"],
      "denyOpenGroups": true,
      "requireMentionInGroups": true,
    },
  },
  "gateway": {
    "exposure": {
      "allowNonLoopbackBind": false,
      "allowTailscaleFunnel": false,
    },
    "auth": {
      "requireAuth": true,
      "requireExplicitRateLimit": true,
    },
    "controlUi": {
      "allowInsecure": false,
    },
    "remote": {
      "allow": false,
    },
    "http": {
      "denyEndpoints": ["chatCompletions", "responses"],
      "requireUrlAllowlists": true,
    },
    "nodes": {
      "denyCommands": ["system.run"],
    },
  },
  "agents": {
    "workspace": {
      "allowedAccess": ["none", "ro"],
      "denyTools": ["exec", "process", "write", "edit", "apply_patch"],
    },
  },
  "dataHandling": {
    "sensitiveLogging": {
      "requireRedaction": true,
    },
    "telemetry": {
      "denyContentCapture": true,
    },
    "retention": {
      "requireSessionMaintenance": true,
    },
    "memory": {
      "denySessionTranscriptIndexing": true,
    },
  },
  "secrets": {
    "requireManagedProviders": true,
    "denySources": ["exec"],
    "allowInsecureProviders": false,
  },
  "auth": {
    "profiles": {
      "requireMetadata": ["provider", "mode"],
      "allowModes": ["api_key", "token"],
    },
  },
  "execApprovals": {
    "requireFile": true,
    "defaults": { "allowSecurity": ["deny"] },
    "agents": {
      "allowSecurity": ["deny", "allowlist"],
      "allowAutoAllowSkills": false,
      "allowlist": { "expected": ["deploy", "status"] },
    },
  },
  "tools": {
    "requireMetadata": ["risk", "sensitivity", "owner"],
    "profiles": {
      "allow": ["messaging", "minimal"],
    },
    "fs": {
      "requireWorkspaceOnly": true,
    },
    "exec": {
      "allowSecurity": ["deny", "allowlist"],
      "requireAsk": ["always"],
      "allowHosts": ["sandbox"],
    },
    "elevated": {
      "allow": false,
    },
    "denyTools": ["group:runtime", "group:fs"],
  },
}
```

ملاحظات شاملة لا تتضح من جداول القواعد أدناه:

- يعني حذف `gateway.bind` مع منع عمليات الربط بغير local loopback أنك تقبل القيمة الافتراضية لوقت التشغيل؛ اضبط `gateway.bind: "loopback"` لتحقيق امتثال صارم.
- بالنسبة إلى وكيل للقراءة فقط، اضبط `mode` للعزل على `all` أو `non-main` في الإعدادات الافتراضية/الوكيل المعني، واضبط `workspaceAccess` على `none` أو `ro`. لا يحقق وضع العزل المفقود أو المضبوط على `off` سياسة القراءة فقط.
- يقبل `agents.workspace.denyTools` القيم `exec` و`process` و`write` و`edit` و`apply_patch`. وتحقق مجموعتا منع الأدوات في التهيئة `group:fs` (تعديل الملفات) و`group:runtime` (الصدفة/العمليات) الوضع المكافئ.
- لا تقرأ عمليات التحقق من موافقات التنفيذ العنصر الفعلي `exec-approvals.json` إلا عند وجود قاعدة `execApprovals`؛ ويُعد العنصر المفقود أو غير الصالح دليلًا غير قابل للرصد، وليس اجتيازًا مصطنعًا.
- لا تسجل أدلة الأسرار وملفات تعريف المصادقة سوى وضع الموفّر/المصدر والبيانات الوصفية لـ SecretRef، ولا تسجل القيم الخام أبدًا. لا تقرأ السياسة مخازن بيانات الاعتماد الخاصة بكل وكيل مثل `auth-profiles.json` ولا تصادق عليها.
- تقتصر أدلة معالجة البيانات على الوضع في مستوى التهيئة (وضع التنقيح، ومفتاح تبديل التقاط بيانات القياس عن بُعد، ووضع صيانة الجلسات، وإعداد فهرسة النصوص المنسوخة). وهي لا تفحص السجلات أو صادرات بيانات القياس عن بُعد أو النصوص المنسوخة أو ملفات الذاكرة، ولا تثبت النتيجة السليمة عدم وجود بيانات شخصية أو أسرار فيها.

### مرجع قواعد السياسة

كل قاعدة أدناه اختيارية؛ ولا يعمل التحقق إلا عند وجود القاعدة. الحالة المرصودة هي تهيئة OpenClaw الحالية أو البيانات الوصفية لمساحة العمل.

#### التراكبات محددة النطاق

استخدم `scopes.<scopeName>` عندما تحتاج وكلاء أو قنوات محددة إلى سياسة أكثر صرامة من خط الأساس في المستوى الأعلى. اسم النطاق مجرد تسمية؛ وتستخدم المطابقة المحدد الموجود داخل النطاق. التراكبات تراكمية: تظل القاعدة العامة قيد التشغيل، ويمكن للقاعدة محددة النطاق إضافة نتيجة خاصة بها استنادًا إلى الأدلة نفسها.

| المحدد       | الأقسام المدعومة                                                               | يُستخدم عندما                                          |
| ------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------ |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory`, `execApprovals` | يحتاج وكيل وقت تشغيل واحد أو أكثر إلى قواعد أشد صرامة. |
| `channelIds` | `ingress.channels`                                                             | تحتاج قناة واحدة أو أكثر إلى قواعد ورود أشد صرامة.    |

إذا لم يكن أحد إدخالات `agentIds` موجودًا في `agents.list[]`، فسيقيّم OpenClaw القاعدة محددة النطاق وفق الوضع العام/الافتراضي الموروث لمعرّف وكيل وقت التشغيل ذاك بدلًا من تخطيها.

```jsonc
{
  "tools": {
    "exec": {
      "allowHosts": ["sandbox", "node"],
    },
  },
  "sandbox": {
    "requireMode": ["all", "non-main"],
  },
  "scopes": {
    "release-workspace": {
      "agentIds": ["release-agent", "review-agent"],
      "agents": {
        "workspace": {
          "allowedAccess": ["none", "ro"],
        },
      },
    },
    "release-lockdown": {
      "agentIds": ["release-agent"],
      "tools": {
        "exec": {
          "allowHosts": ["sandbox"],
          "allowSecurity": ["deny", "allowlist"],
          "requireAsk": ["always"],
        },
        "denyTools": ["exec", "process", "write", "edit", "apply_patch"],
      },
      "sandbox": {
        "requireMode": ["all"],
        "allowBackends": ["docker"],
      },
      "dataHandling": {
        "memory": {
          "denySessionTranscriptIndexing": true,
        },
      },
    },
    "shell-sandbox": {
      "agentIds": ["shell-agent"],
      "sandbox": {
        "allowBackends": ["openshell"],
        "containers": {
          "requireReadOnlyMounts": false,
        },
      },
    },
    "telegram-ingress": {
      "channelIds": ["telegram"],
      "ingress": {
        "channels": {
          "allowDmPolicies": ["pairing"],
          "denyOpenGroups": true,
          "requireMentionInGroups": true,
        },
      },
    },
  },
}
```

يمكن أن يظهر الوكيل نفسه في نطاقات متعددة إذا كان كل نطاق يحكم حقلًا مختلفًا، كما في المثال أعلاه. يجب أن يكون الحقل محدد النطاق المتكرر للوكيل نفسه مساويًا في التقييد أو أشد تقييدًا؛ ويُرفض الادعاء المكرر الأضعف (تكون قوائم السماح مجموعات جزئية، وقوائم المنع مجموعات شاملة، وتكون القيم المنطقية المطلوبة ثابتة).

لا تُفحص قواعد وضع الحاويات (`sandbox.containers.*`) إلا وفق الأدلة التي تستطيع الواجهة الخلفية لعزل الوكيل المطابق عرضها. إذا تعذر على واجهة خلفية رصد قاعدة فعّلتها لها، فستبلغ السياسة عن `policy/sandbox-container-posture-unobservable` بدلًا من اعتبارها ناجحة؛ حدّد نطاق قواعد الحاويات لمجموعات الوكلاء التي تستخدم واجهة خلفية قادرة على عرضها.

يظل `ingress.session.requireDmScope` في المستوى الأعلى عامًا؛ فـ`session.dmScope` ليس دليلًا يمكن نسبه إلى قناة، ولذلك لا يمكن تحديد نطاقه باستخدام `channelIds`.

يجب أن يكون كل نطاق موجود في `policy.jsonc` صالحًا وقابلًا للإنفاذ.

#### القنوات

| حقل السياسة                           | الحالة المرصودة                         | يُستخدم عندما                                                |
| ------------------------------------ | --------------------------------------- | ------------------------------------------------------------ |
| `channels.denyRules[].when.provider` | موفّر `channels.*` وحالة التفعيل        | منع القنوات المهيأة التابعة لموفّر مثل `telegram`.           |
| `channels.denyRules[].reason`        | سياق رسالة النتيجة وتلميح الإصلاح       | توضيح سبب منع الموفّر.                                       |

#### خوادم MCP

| حقل السياسة         | الحالة المرصودة       | يُستخدم عندما                                                    |
| ------------------- | --------------------- | ---------------------------------------------------------------- |
| `mcp.servers.allow` | معرّفات `mcp.servers.*` | اشتراط وجود كل خادم MCP مهيأ ضمن قائمة سماح.                    |
| `mcp.servers.deny`  | معرّفات `mcp.servers.*` | منع معرّفات محددة لخوادم MCP المهيأة.                           |

#### موفّرو النماذج

| حقل السياسة              | الحالة المرصودة                                      | يُستخدم عندما                                                                             |
| ------------------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `models.providers.allow` | معرّفات `models.providers.*` ومراجع النماذج المحددة | اشتراط استخدام الموفّرين المهيئين ومراجع النماذج المحددة لموفّرين معتمدين.                |
| `models.providers.deny`  | معرّفات `models.providers.*` ومراجع النماذج المحددة | منع الموفّرين المهيئين ومراجع النماذج المحددة حسب معرّف الموفّر.                          |

#### الشبكة

| حقل السياسة                    | الحالة المرصودة                           | يُستخدم عندما                                                       |
| ------------------------------ | ----------------------------------------- | ------------------------------------------------------------------- |
| `network.privateNetwork.allow` | منافذ الإفلات من SSRF إلى الشبكة الخاصة | الضبط على `false` لاشتراط بقاء الوصول إلى الشبكة الخاصة معطّلًا.   |

#### الوصول الوارد والوصول إلى القنوات

| حقل السياسة                              | الحالة المرصودة                                                 | يُستخدم عندما                                                           |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------ |
| `ingress.session.requireDmScope`          | `session.dmScope`                                              | اشتراط نطاق عزل مُراجَع للرسائل المباشرة.                 |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` وحقول سياسة الرسائل المباشرة القديمة للقنوات      | السماح فقط بسياسات قنوات الرسائل المباشرة المُراجَعة.               |
| `ingress.channels.denyOpenGroups`         | سياسة دخول القناة والحساب والمجموعة                     | منع دخول المجموعات المفتوحة للقنوات والحسابات المُهيأة.      |
| `ingress.channels.requireMentionInGroups` | إعداد بوابة الإشارة للقناة والحساب والمجموعة والخادم والإشارات المتداخلة | اشتراط بوابات الإشارة عندما يكون دخول المجموعة مفتوحًا أو مقيّدًا بالإشارة. |

#### Gateway

| حقل السياسة                            | الحالة المرصودة                                 | يُستخدم عندما                                                                             |
| --------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                 | الضبط على `false` لاشتراط ربط Gateway بالواجهة المحلية.                                  |
| `gateway.exposure.allowTailscaleFunnel` | وضع تقديم/نفق Gateway عبر Tailscale         | الضبط على `false` لمنع تعريض Tailscale Funnel.                                    |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                            | الضبط على `true` لرفض تعطيل مصادقة Gateway.                                       |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                       | الضبط على `true` لاشتراط إعداد صريح لتحديد معدل المصادقة.                            |
| `gateway.controlUi.allowInsecure`       | مفاتيح تبديل المصادقة/الجهاز/المصدر غير الآمنة في واجهة التحكم | الضبط على `false` لمنع مفاتيح تبديل التعريض غير الآمن لواجهة التحكم.                         |
| `gateway.remote.allow`                  | وضع/إعداد Gateway البعيد                     | الضبط على `false` لمنع وضع Gateway البعيد.                                          |
| `gateway.http.denyEndpoints`            | نقاط نهاية واجهة HTTP البرمجية لـ Gateway                     | منع معرّفات نقاط النهاية مثل `chatCompletions` أو `responses`.                          |
| `gateway.http.requireUrlAllowlists`     | مدخلات جلب عناوين URL عبر HTTP في Gateway                  | الضبط على `true` لاشتراط قوائم سماح لعناوين URL في مدخلات جلبها.                         |
| `gateway.nodes.denyCommands`            | `gateway.nodes.denyCommands`                   | اشتراط منع معرّفات أوامر Node الدقيقة مثل `system.run` في إعداد OpenClaw. |

`gateway.nodes.denyCommands` قاعدة مجموعة منع شاملة دقيقة وحساسة لحالة الأحرف.
استخدمها عندما يجب أن تثبت السياسة أن أوامر Node ذات الامتيازات ممنوعة صراحةً
بواسطة إعداد OpenClaw. يجب على عملية النشر التي تسمح عمدًا بأمر Node ذي امتيازات
تحديث `policy.jsonc` بعد المراجعة بدلًا من الاعتماد على
`gateway.nodes.allowCommands` وحده.

#### مساحة عمل الوكيل

| حقل السياسة                     | الحالة المرصودة                                                                        | يُستخدم عندما                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` و`agents.list[].sandbox.workspaceAccess` | السماح فقط بقيم وصول مساحة عمل صندوق العزل مثل `none` أو `ro`.                       |
| `agents.workspace.denyTools`     | إعداد منع الأدوات العام والخاص بكل وكيل                                                 | اشتراط منع أدوات التعديل (`exec` و`process` و`write` و`edit` و`apply_patch`). |

#### وضع صندوق العزل

| حقل السياسة                                          | الحالة المرصودة                                          | يُستخدم عندما                                                       |
| ----------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| `sandbox.requireMode`                                 | `agents.defaults.sandbox.mode` ووضع كل وكيل       | السماح فقط بأوضاع صندوق العزل المُراجَعة مثل `all` أو `non-main`. |
| `sandbox.allowBackends`                               | `agents.defaults.sandbox.backend` وواجهة كل وكيل الخلفية | السماح فقط بواجهات صندوق العزل الخلفية المُراجَعة مثل `docker`.         |
| `sandbox.containers.denyHostNetwork`                  | وضع شبكة صندوق العزل/المتصفح المدعوم بالحاويات           | منع وضع شبكة المضيف.                                        |
| `sandbox.containers.denyContainerNamespaceJoin`       | وضع شبكة صندوق العزل/المتصفح المدعوم بالحاويات           | منع الانضمام إلى نطاق أسماء شبكة حاوية أخرى.              |
| `sandbox.containers.requireReadOnlyMounts`            | وضع تركيب صندوق العزل/المتصفح المدعوم بالحاويات             | اشتراط أن تكون نقاط التركيب للقراءة فقط.                                |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | أهداف تركيب صندوق العزل/المتصفح المدعوم بالحاويات          | منع تركيب مقابس وقت تشغيل الحاويات.                          |
| `sandbox.containers.denyUnconfinedProfiles`           | وضع ملفات تعريف أمان الحاويات                      | منع ملفات تعريف أمان الحاويات غير المقيّدة.                   |
| `sandbox.browser.requireCdpSourceRange`               | نطاق مصدر CDP لمتصفح صندوق العزل                        | اشتراط إعلان نطاق مصدر عند تعريض CDP للمتصفح.        |

تعامل السياسة غياب `sandbox.mode` باعتباره القيمة الافتراضية الضمنية `off`، ولذلك
يُبلغ `sandbox.requireMode` عن صندوق عزل جديد أو غير مُهيأ بوصفه خارج
قائمة سماح مثل `["all"]`.

#### معالجة البيانات

| حقل السياسة                                        | الحالة المرصودة                                                                       | يُستخدم عندما                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                            | الضبط على `true` لرفض `logging.redactSensitive: "off"`.              |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                    | الضبط على `true` لرفض التقاط محتوى بيانات القياس عن بُعد.                     |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                           | الضبط على `true` لاشتراط وضع صيانة جلسة فعّال بقيمة `enforce`. |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` و`agents.*.memorySearch.experimental.sessionMemory` | الضبط على `true` لرفض فهرسة نصوص الجلسات في الذاكرة.       |

#### الأسرار

| حقل السياسة                      | الحالة المرصودة                                           | يُستخدم عندما                                                                |
| --------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| `secrets.requireManagedProviders` | مراجع الأسرار في الإعداد وتعريفات `secrets.providers.*` | الضبط على `true` لاشتراط أن تشير مراجع الأسرار إلى موفّرين مُعلنين.     |
| `secrets.denySources`             | مصادر موفّري الأسرار ومصادر مراجع الأسرار            | منع مصادر مثل `exec` أو `file` أو اسم مصدر مُهيأ آخر. |
| `secrets.allowInsecureProviders`  | أعلام وضع موفّر الأسرار غير الآمن                   | الضبط على `false` لرفض الموفّرين الذين يختارون الوضع غير الآمن.      |

#### موافقات التنفيذ

تقرأ فحوصات موافقات التنفيذ ملف وقت التشغيل `exec-approvals.json`:
`~/.openclaw/exec-approvals.json` افتراضيًا، أو
`$OPENCLAW_STATE_DIR/exec-approvals.json` عند ضبط `OPENCLAW_STATE_DIR`.
تتطلب قواعد الوضع ضمن `execApprovals.defaults.*` أو `execApprovals.agents.*`
دليلًا من ملف قابل للقراءة؛ ويُبلّغ عن الملف المفقود أو غير الصالح بوصفه
دليلًا غير قابل للرصد بدلًا من اعتباره اجتيازًا بأفضل جهد. بعد أن يصبح قابلًا للقراءة، ترث
الحقول المحذوفة قيم وقت التشغيل الافتراضية: تكون قيمة `defaults.security` المفقودة هي `full`،
ويرث أمان الوكيل المفقود تلك القيمة الافتراضية. يشمل الدليل `defaults`
و`agents.*` و`agents.*.allowlist[].pattern` و`argPattern` الاختياري ووضع
`autoAllowSkills` الفعّال ومصدر الإدخال — ولا يشمل مطلقًا مسار المقبس/الرمز المميز
أو `commandText` أو `lastUsedCommand` أو المسارات المحلولة أو الطوابع الزمنية.

| حقل السياسة                                | الحالة المرصودة                                                                         | يُستخدم عندما                                                                                |
| ------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                 | مسار `exec-approvals.json` النشط في وقت التشغيل                                              | الضبط على `true` لاشتراط وجود ملف الموافقات وإمكان تحليله.                     |
| `execApprovals.defaults.allowSecurity`      | `defaults.security`، وقيمته الافتراضية `full`                                              | السماح فقط بأوضاع أمان الموافقات الافتراضية المعتمدة.                                    |
| `execApprovals.agents.allowSecurity`        | `agents.*.security`، مع وراثة القيم الافتراضية                                               | السماح فقط بأوضاع أمان الموافقات الفعّالة المعتمدة لكل وكيل.                        |
| `execApprovals.agents.allowAutoAllowSkills` | `defaults.autoAllowSkills` و`agents.*.autoAllowSkills`، مع وراثة قيم وقت التشغيل الافتراضية | الضبط على `false` لاشتراط قوائم سماح يدوية صارمة من دون موافقة ضمنية على CLI الخاص بـ Skills. |
| `execApprovals.agents.allowlist.expected`   | إدخالات نمط `agents.*.allowlist[]` المجمّعة وإدخالات argPattern الاختيارية               | اشتراط تطابق قائمة سماح الموافقات مع مجموعة الأنماط المُراجَعة.                      |

مثال: اشتراط ملف الموافقات، ومنع القيم الافتراضية المتساهلة، والسماح
فقط بوضع موافقات التنفيذ المُراجَع للوكلاء المحددين.

```jsonc
{
  "execApprovals": {
    "requireFile": true,
    "defaults": {
      // أوضاع الأمان: "deny" أو "allowlist" أو "full".
      // لا يسمح هذا الإعداد الافتراضي إلا بوضع المنع المحكم.
      "allowSecurity": ["deny"],
    },
  },
  "scopes": {
    "restricted-shell": {
      "agentIds": ["family-agent", "groups-agent"],
      "execApprovals": {
        "agents": {
          // يمكن للوكلاء المحددين استخدام وضع قائمة السماح الذي خضع للمراجعة، ولكن ليس "full".
          "allowSecurity": ["allowlist"],
          // تعني false أن واجهات CLI الخاصة بـ Skills يجب أن تظهر في قائمة السماح التي خضعت للمراجعة بدلًا من
          // الموافقة عليها ضمنيًا بواسطة autoAllowSkills.
          "allowAutoAllowSkills": false,
          "allowlist": {
            "expected": [
              // إدخال بسيط: نمط دقيق للملف التنفيذي الذي خضع للمراجعة من دون argPattern.
              "travel-hub",
              // إدخال مقيّد: نمط بالإضافة إلى تعبير نمطي للوسيط خضع للمراجعة.
              { "pattern": "calendar-cli", "argPattern": "^sync\\b" },
              "/bin/date",
            ],
          },
        },
      },
    },
  },
}
```

#### ملفات تعريف المصادقة

| حقل السياسة                     | الحالة المرصودة                               | يُستخدم عندما                                                                                   |
| ------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `auth.profiles.requireMetadata` | بيانات موفّر `auth.profiles.*` ووضعه الوصفية | يلزم وجود مفاتيح بيانات وصفية مثل `provider` و`mode` في ملفات تعريف مصادقة الإعدادات.               |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                       | يسمح فقط بأوضاع ملفات تعريف المصادقة المدعومة مثل `api_key` أو `aws-sdk` أو `oauth` أو `token`. |

#### البيانات الوصفية للأدوات

| حقل السياسة             | الحالة المرصودة                   | يُستخدم عندما                                                                                   |
| ----------------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| `tools.requireMetadata` | تعريفات `TOOLS.md` الخاضعة للحوكمة | يلزم الأدوات الخاضعة للحوكمة بالتصريح عن مفاتيح بيانات وصفية مثل `risk` أو `sensitivity` أو `owner`. |

#### وضع الأدوات

| حقل السياسة                     | الحالة المرصودة                                               | يُستخدم عندما                                                                                                  |
| ------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` و`agents.list[].tools.profile`           | يسمح فقط بمعرّفات ملفات تعريف الأدوات مثل `minimal` أو `messaging` أو `coding`.                                 |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` وتجاوزات `tools.fs` الخاصة بكل وكيل | يُضبط على `true` لاشتراط قصر وضع أدوات نظام الملفات على مساحة العمل.                                         |
| `tools.exec.allowSecurity`      | `tools.exec.security` وأمان التنفيذ الخاص بكل وكيل           | يسمح فقط بأوضاع أمان التنفيذ مثل `deny` أو `allowlist`.                                            |
| `tools.exec.requireAsk`         | `tools.exec.ask` ووضع طلب التنفيذ الخاص بكل وكيل                | يشترط وضع موافقة مثل `always`.                                                               |
| `tools.exec.allowHosts`         | `tools.exec.host` وتوجيه مضيف التنفيذ الخاص بكل وكيل           | يسمح فقط بأوضاع توجيه مضيف التنفيذ مثل `sandbox`.                                                    |
| `tools.elevated.allow`          | `tools.elevated.enabled` والوضع المرتفع الخاص بكل وكيل     | يُضبط على `false` لاشتراط بقاء وضع الأدوات المرتفع معطلًا.                                           |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` و`tools.alsoAllow` الخاص بكل وكيل           | يشترط إدخالات `alsoAllow` الدقيقة ويبلّغ عن منح الأدوات الإضافية المفقودة أو غير المتوقعة.                 |
| `tools.denyTools`               | `tools.deny` و`agents.list[].tools.deny`                 | يشترط أن تتضمن قوائم منع الأدوات المضبوطة معرّفات أدوات أو مجموعات مثل `group:runtime` و`group:fs`. |

## تشغيل الفحوصات

شغّل فحوصات السياسة فقط أثناء التأليف:

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

يشغّل `policy check` مجموعة فحوصات السياسة فقط ويصدر الأدلة والنتائج
وتجزئات التصديق. تظهر النتائج نفسها أيضًا في
`openclaw doctor --lint` عند تمكين Plugin السياسة.

قارن ملف سياسة المشغّل بخط أساس مؤلَّف:

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

يتحقق `policy compare` من صياغة ملف السياسة مقابل صياغة ملف السياسة؛ وهو
لا يفحص حالة وقت التشغيل أو الأدلة أو بيانات الاعتماد أو الأسرار. ويستخدم
البيانات الوصفية نفسها للقواعد التي تحكم التراكبات محددة النطاق: يجب أن تبقى
قوائم السماح مساوية أو أضيق، وأن تبقى قوائم المنع مساوية أو أوسع، وأن تحتفظ
القيم المنطقية المطلوبة بقيمتها، ولا يجوز للسلاسل المرتبة الانتقال إلا نحو
الطرف الأكثر صرامة من الترتيب المضبوط، ويجب أن تتطابق القوائم الدقيقة. يمكن
أن يكون خط الأساس سياسة مؤلَّفة من المؤسسة؛ ويجوز للسياسة التي يجري فحصها
إضافة قيم أكثر صرامة أو قواعد إضافية. يمكن لقاعدة مفحوصة من المستوى الأعلى
استيفاء قاعدة خط أساس محددة النطاق عندما تكون مساوية أو أكثر تقييدًا. لا
يلزم تطابق أسماء النطاقات بين الملفات؛ إذ تعتمد المقارنة على المحدد
(`agentIds`/`channelIds`) والحقل.

مقارنة سليمة (`--json`):

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

يتضمن ناتج `policy check --json` السليم تجزئات مستقرة يمكن للمشغّل أو
المشرف تسجيلها:

```json
{
  "ok": true,
  "attestation": {
    "policy": {
      "path": "policy.jsonc",
      "hash": "sha256:..."
    },
    "workspace": {
      "scope": "policy",
      "hash": "sha256:..."
    },
    "findingsHash": "sha256:...",
    "attestationHash": "sha256:..."
  },
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": []
}
```

## ضبط السياسة

يوجد إعداد السياسة ضمن `plugins.entries.policy.config`.

```jsonc
{
  "plugins": {
    "entries": {
      "policy": {
        "enabled": true,
        "config": {
          "enabled": true,
          "path": "policy.jsonc",
          "workspaceRepairs": false,
          "expectedHash": "sha256:...",
          "expectedAttestationHash": "sha256:...",
        },
      },
    },
  },
}
```

| الإعداد                     | الغرض                                                         |
| ------------------------- | --------------------------------------------------------------- |
| `enabled`                 | تمكين فحوصات السياسة حتى قبل وجود `policy.jsonc`.         |
| `workspaceRepairs`        | السماح لـ `doctor --fix` بتعديل إعدادات مساحة العمل التي تديرها السياسة. |
| `expectedHash`            | قفل تجزئة اختياري لأثر السياسة المعتمد.            |
| `expectedAttestationHash` | قفل تجزئة اختياري لآخر فحص سياسة سليم جرى قبوله.    |
| `path`                    | موقع أثر السياسة بالنسبة إلى مساحة العمل.             |

اضبط `plugins.entries.policy.config.enabled` على `false` لتعطيل فحوصات
السياسة لمساحة عمل مع إبقاء Plugin مثبتًا.

## قبول حالة السياسة

مثال على ناتج JSON:

```json
{
  "ok": true,
  "attestation": {
    "checkedAt": "2026-05-10T20:00:00.000Z",
    "policy": {
      "path": "policy.jsonc",
      "hash": "sha256:..."
    },
    "workspace": {
      "scope": "policy",
      "hash": "sha256:..."
    },
    "findingsHash": "sha256:...",
    "attestationHash": "sha256:..."
  },
  "evidence": {
    "channels": [
      {
        "id": "telegram",
        "provider": "telegram",
        "source": "oc://openclaw.config/channels/telegram",
        "enabled": false
      }
    ],
    "mcpServers": [
      {
        "id": "docs",
        "transport": "stdio",
        "source": "oc://openclaw.config/mcp/servers/docs",
        "command": "npx"
      }
    ],
    "modelProviders": [
      {
        "id": "openai",
        "source": "oc://openclaw.config/models/providers/openai"
      }
    ],
    "modelRefs": [
      {
        "ref": "openai/gpt-5.6-sol",
        "provider": "openai",
        "model": "gpt-5.6-sol",
        "source": "oc://openclaw.config/agents/defaults/model"
      }
    ],
    "network": [
      {
        "id": "browser-private-network",
        "source": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
        "value": false
      }
    ],
    "gatewayExposure": [
      {
        "id": "gateway-bind",
        "kind": "bind",
        "source": "oc://openclaw.config/gateway/bind",
        "value": "loopback",
        "nonLoopback": false,
        "explicit": true
      }
    ],
    "agentWorkspace": [
      {
        "id": "agents-defaults-workspace-access",
        "kind": "workspaceAccess",
        "source": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
        "scope": "defaults",
        "value": "ro",
        "sandboxMode": "all",
        "sandboxModeSource": "oc://openclaw.config/agents/defaults/sandbox/mode",
        "sandboxEnabled": true,
        "explicit": true
      },
      {
        "id": "agents-defaults-tool-exec",
        "kind": "toolDeny",
        "source": "oc://openclaw.config/tools/deny",
        "scope": "defaults",
        "tool": "exec",
        "denied": true,
        "explicit": true
      }
    ],
    "secrets": [
      {
        "id": "vault",
        "kind": "provider",
        "source": "oc://openclaw.config/secrets/providers/vault",
        "providerSource": "env"
      },
      {
        "id": "oc://openclaw.config/models/providers/openai/apiKey",
        "kind": "input",
        "source": "oc://openclaw.config/models/providers/openai/apiKey",
        "provenance": "secretRef",
        "refSource": "env",
        "refProvider": "vault"
      }
    ],
    "authProfiles": [
      {
        "id": "github",
        "source": "oc://openclaw.config/auth/profiles/github",
        "validMetadata": true,
        "provider": "github",
        "mode": "token"
      }
    ],
    "tools": [
      {
        "id": "deploy",
        "source": "oc://TOOLS.md/tools/deploy",
        "line": 12,
        "risk": "critical",
        "sensitivity": "restricted",
        "capabilities": ["IRREVERSIBLE_EXTERNAL"]
      }
    ]
  },
  "checksRun": 30,
  "checksSkipped": 0,
  "findings": []
}
```

تحدّد `attestation.policy.hash` أثر القاعدة المؤلَّف. وتسجّل `evidence`
حالة OpenClaw المرصودة التي استخدمتها الفحوصات، وتحدّد
`workspace.hash` حمولة الأدلة تلك. وتحدّد `findingsHash`
مجموعة النتائج الدقيقة. ويسجّل `checkedAt` وقت تشغيل الفحص.
وتحدّد `attestationHash` الادعاء المستقر (تجزئة السياسة وتجزئة الأدلة
وتجزئة النتائج وحالة السلامة أو وجود مشكلات)، وتستبعد `checkedAt` عمدًا،
بحيث تنتج حالة السياسة نفسها دائمًا تجزئة التصديق نفسها. وتشكّل هذه القيم
الأربع معًا رباعية التدقيق لفحص سياسة واحد.

إذا كان Gateway أو المشرف يستخدم السياسة لحظر إجراء في وقت التشغيل أو
الموافقة عليه أو إضافة تعليق توضيحي إليه، فينبغي له تسجيل تجزئة التصديق
من آخر فحص سليم. تبقى `checkedAt` في ناتج JSON لسجلات التدقيق، لكنها ليست
جزءًا من التجزئة المستقرة.

دورة حياة قبول حالة السياسة:

1. ألّف `policy.jsonc` أو راجعه.
2. شغّل `openclaw policy check --json`.
3. إذا كان سليمًا، فسجّل `attestation.policy.hash` بوصفه `expectedHash`.
4. سجّل `attestation.attestationHash` بوصفه `expectedAttestationHash`.
5. أعد تشغيل `openclaw doctor --lint` في CI أو بوابات الإصدار.

إذا تغيرت قواعد السياسة عمدًا، فحدّث التجزئتين المقبولتين استنادًا إلى
فحص نظيف. إذا تغيرت إعدادات مساحة العمل فقط (وظلت السياسة كما هي)،
فعادةً ما تتغير `expectedAttestationHash` فقط.

يؤدي تمكين قواعد `agents.workspace` أو ترقيتها إلى إضافة دليل `agentWorkspace`
إلى تجزئة مساحة العمل وتجزئة الإقرار؛ راجع الدليل الجديد وحدّث
تجزئات الإقرار المقبولة بعد التمكين. ويؤدي تمكين قواعد وضع الأدوات أو ترقيتها
إلى إضافة دليل `toolPosture` بالطريقة نفسها.

يعيد `openclaw policy watch` تشغيل الفحص ويُبلغ عندما لا تعود الأدلة الحالية
مطابقة لـ `expectedAttestationHash`:

```bash
openclaw policy watch --json
```

استخدم `--once` في CI أو البرامج النصية التي تحتاج إلى تقييم واحد للانحراف. من دون
`--once`، يجري الاستقصاء كل ثانيتين افتراضيًا؛ استخدم `--interval-ms` لتغيير
الفاصل الزمني.

## النتائج

| معرّف الفحص                                              | النتيجة                                                                           |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | السياسة مُمكّنة، لكن `policy.jsonc` مفقود.                                        |
| `policy/policy-jsonc-invalid`                            | يتعذر تحليل السياسة أو أنها تحتوي على إدخالات قواعد مشوهة.                       |
| `policy/policy-hash-mismatch`                            | السياسة لا تطابق `expectedHash` المُهيأة.                                         |
| `policy/attestation-hash-mismatch`                       | لم تعد أدلة السياسة الحالية تطابق الإقرار المقبول.                               |
| `policy/policy-conformance-invalid`                      | يحتوي ملف السياسة الأساسي أو الخاضع للفحص على صياغة مقارنة غير صالحة.            |
| `policy/policy-conformance-missing`                      | يفتقد ملف السياسة الخاضع للفحص قاعدةً مطلوبةً في ملف السياسة الأساسي.            |
| `policy/policy-conformance-weaker`                       | يحتوي ملف السياسة الخاضع للفحص على قيمة أضعف من ملف السياسة الأساسي.             |
| `policy/channels-denied-provider`                        | تطابق قناة مُمكّنة قاعدة رفض للقنوات.                                              |
| `policy/mcp-denied-server`                               | ترفض السياسة خادم MCP مُهيأ.                                                       |
| `policy/mcp-unapproved-server`                           | يقع خادم MCP مُهيأ خارج قائمة السماح.                                              |
| `policy/models-denied-provider`                          | يستخدم موفر نموذج مُهيأ أو مرجع نموذج موفرًا مرفوضًا.                             |
| `policy/models-unapproved-provider`                      | يقع موفر نموذج مُهيأ أو مرجع نموذج خارج قائمة السماح.                             |
| `policy/network-private-access-enabled`                  | مخرج تجاوز SSRF للشبكة الخاصة مُمكّن رغم أن السياسة ترفضه.                        |
| `policy/ingress-dm-policy-unapproved`                    | تقع سياسة الرسائل المباشرة لإحدى القنوات خارج قائمة سماح السياسة.                 |
| `policy/ingress-dm-scope-unapproved`                     | لا يطابق `session.dmScope` نطاق عزل الرسائل المباشرة الذي تتطلبه السياسة.         |
| `policy/ingress-open-groups-denied`                      | سياسة مجموعة إحدى القنوات هي `open` بينما ترفض السياسة دخول المجموعات المفتوحة.  |
| `policy/ingress-group-mention-required`                  | يعطّل إدخال قناة أو مجموعة بوابات الإشارة بينما تتطلبها السياسة.                  |
| `policy/gateway-non-loopback-bind`                       | يسمح وضع ربط Gateway بالتعرض خارج local loopback بينما ترفضه السياسة.             |
| `policy/gateway-auth-disabled`                           | مصادقة Gateway معطلة بينما تتطلب السياسة المصادقة.                                |
| `policy/gateway-rate-limit-missing`                      | وضع تحديد معدل مصادقة Gateway غير صريح بينما تتطلبه السياسة.                     |
| `policy/gateway-control-ui-insecure`                     | مفاتيح تبديل التعرض غير الآمن لواجهة تحكم Gateway مُمكّنة.                         |
| `policy/gateway-tailscale-funnel`                        | التعرض عبر Tailscale Funnel في Gateway مُمكّن بينما ترفضه السياسة.                 |
| `policy/gateway-remote-enabled`                          | الوضع البعيد لـ Gateway نشط بينما ترفضه السياسة.                                  |
| `policy/gateway-http-endpoint-enabled`                   | نقطة نهاية لواجهة HTTP API في Gateway مُمكّنة رغم أن السياسة ترفضها.              |
| `policy/gateway-http-url-fetch-unrestricted`             | تفتقر مدخلات جلب عناوين URL عبر HTTP في Gateway إلى قائمة سماح مطلوبة للعناوين.   |
| `policy/gateway-node-command-denied`                     | أمر Node مرفوض بموجب السياسة لا يرفضه إعداد OpenClaw.                             |
| `policy/agents-workspace-access-denied`                  | يقع وضع الحاوية المعزولة للوكيل أو وصوله إلى مساحة العمل خارج قائمة سماح السياسة. |
| `policy/agents-tool-not-denied`                          | لا يرفض إعداد وكيل أو الإعداد الافتراضي أداةً تتطلب السياسة رفضها.                |
| `policy/tools-profile-unapproved`                        | يقع ملف أدوات عام أو خاص بوكيل مُهيأ خارج قائمة السماح.                           |
| `policy/tools-fs-workspace-only-required`                | أدوات نظام الملفات غير مهيأة بوضع مسارات يقتصر على مساحة العمل.                  |
| `policy/tools-exec-security-unapproved`                  | يقع وضع أمان التنفيذ خارج قائمة سماح السياسة.                                     |
| `policy/tools-exec-ask-unapproved`                       | يقع وضع طلب التنفيذ خارج قائمة سماح السياسة.                                      |
| `policy/tools-exec-host-unapproved`                      | يقع توجيه مضيف التنفيذ خارج قائمة سماح السياسة.                                   |
| `policy/tools-elevated-enabled`                          | وضع الأدوات ذات الامتيازات المرتفعة مُمكّن بينما ترفضه السياسة.                   |
| `policy/tools-also-allow-missing`                        | تفتقد قائمة `alsoAllow` مُهيأة إدخالًا تتطلبه السياسة.                            |
| `policy/tools-also-allow-unexpected`                     | تتضمن قائمة `alsoAllow` مُهيأة إدخالًا لا تتوقعه السياسة.                         |
| `policy/tools-required-deny-missing`                     | لا تتضمن قائمة رفض أدوات عامة أو خاصة بوكيل أداةً مرفوضة مطلوبة.                  |
| `policy/sandbox-mode-unapproved`                         | يقع وضع الحاوية المعزولة خارج قائمة سماح السياسة.                                 |
| `policy/sandbox-backend-unapproved`                      | تقع الواجهة الخلفية للحاوية المعزولة خارج قائمة سماح السياسة.                    |
| `policy/sandbox-container-posture-unobservable`          | قاعدة وضع الحاوية مُمكّنة لواجهة خلفية لا يمكنها رصده.                             |
| `policy/sandbox-container-host-network-denied`           | تستخدم حاوية معزولة أو متصفح مدعوم بحاوية وضع شبكة المضيف.                        |
| `policy/sandbox-container-namespace-join-denied`         | تنضم حاوية معزولة أو متصفح مدعوم بحاوية إلى نطاق أسماء حاوية أخرى.                |
| `policy/sandbox-container-mount-mode-required`           | نقطة تحميل حاوية معزولة أو متصفح مدعوم بحاوية ليست للقراءة فقط.                   |
| `policy/sandbox-container-runtime-socket-mount`          | تكشف نقطة تحميل حاوية معزولة أو متصفح مدعوم بحاوية مقبس وقت تشغيل الحاوية.        |
| `policy/sandbox-container-unconfined-profile`            | ملف الحاوية المعزولة غير مقيّد بينما ترفض السياسة ذلك.                            |
| `policy/sandbox-browser-cdp-source-range-missing`        | نطاق مصدر CDP لمتصفح الحاوية المعزولة مفقود بينما تتطلب السياسة وجوده.            |
| `policy/data-handling-redaction-disabled`                | تنقيح السجلات الحساسة معطل بينما تتطلبه السياسة.                                  |
| `policy/data-handling-telemetry-content-capture`         | التقاط محتوى القياس عن بُعد مُمكّن بينما ترفضه السياسة.                           |
| `policy/data-handling-session-retention-not-enforced`    | صيانة الاحتفاظ بالجلسات غير مفروضة بينما تتطلبها السياسة.                         |
| `policy/data-handling-session-transcript-memory-enabled` | فهرسة ذاكرة نصوص الجلسات مُمكّنة بينما ترفضها السياسة.                            |
| `policy/secrets-unmanaged-provider`                      | يشير SecretRef في الإعداد إلى موفر غير معلن ضمن `secrets.providers`.              |
| `policy/secrets-denied-provider-source`                  | يستخدم موفر أسرار في الإعداد أو SecretRef مصدرًا ترفضه السياسة.                   |
| `policy/secrets-insecure-provider`                       | يختار موفر أسرار وضعًا غير آمن بينما ترفضه السياسة.                               |
| `policy/auth-profile-invalid-metadata`                   | يفتقد ملف تعريف مصادقة في الإعداد بيانات وصفية صالحة للموفر أو الوضع.             |
| `policy/auth-profile-unapproved-mode`                    | يقع وضع ملف تعريف مصادقة في الإعداد خارج قائمة سماح السياسة.                     |
| `policy/exec-approvals-missing`                          | تتطلب السياسة `exec-approvals.json`، لكن العنصر مفقود.                            |
| `policy/exec-approvals-invalid`                          | يتعذر تحليل عنصر موافقات التنفيذ المُهيأ.                                          |
| `policy/exec-approvals-default-security-unapproved`      | تستخدم افتراضيات موافقات التنفيذ وضع أمان خارج قائمة سماح السياسة.               |
| `policy/exec-approvals-agent-security-unapproved`        | يقع وضع أمان موافقة التنفيذ الفعلي الخاص بوكيل خارج قائمة السماح.                 |
| `policy/exec-approvals-auto-allow-skills-enabled`        | يسمح وكيل موافقات التنفيذ ضمنيًا وتلقائيًا بواجهات CLI الخاصة بـ Skills بينما ترفض السياسة ذلك. |
| `policy/exec-approvals-allowlist-missing`                | تفتقد قائمة سماح الموافقات نمطًا تتطلبه السياسة.                                  |
| `policy/exec-approvals-allowlist-unexpected`             | تتضمن قائمة سماح الموافقات نمطًا لا تتوقعه السياسة.                               |
| `policy/tools-missing-risk-level`                        | يفتقد تعريف أداة خاضعة للحوكمة بيانات وصفية للمخاطر.                              |
| `policy/tools-unknown-risk-level`                        | يستخدم تعريف أداة خاضعة للحوكمة قيمة مخاطر غير معروفة.                           |
| `policy/tools-missing-sensitivity-token`                 | يفتقد تعريف أداة خاضعة للحوكمة بيانات وصفية للحساسية.                             |
| `policy/tools-missing-owner`                             | يفتقد تعريف أداة خاضعة للحوكمة بيانات وصفية للمالك.                               |
| `policy/tools-unknown-sensitivity-token`                 | يستخدم تعريف أداة خاضعة للحوكمة قيمة حساسية غير معروفة.                          |

يمكن أن تتضمن النتيجة كلًا من `target` (عنصر مساحة العمل المرصود الذي لا
يمتثل) و`requirement` (القاعدة المؤلفة التي جعلته نتيجة).
كلاهما حاليًا سلسلتا عنوان `oc://`، لكن اسمي الحقلين يصفان الدور في السياسة
بدلًا من تنسيق العنوان.

أمثلة على النتائج:

```json
{
  "checkId": "policy/channels-denied-provider",
  "severity": "error",
  "message": "Channel 'telegram' uses denied provider 'telegram'.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/channels/telegram",
  "target": "oc://openclaw.config/channels/telegram",
  "requirement": "oc://policy.jsonc/channels/denyRules/#0",
  "fixHint": "Telegram is not approved for this workspace."
}
```

```json
{
  "checkId": "policy/tools-missing-risk-level",
  "severity": "error",
  "message": "TOOLS.md tool 'deploy' has no explicit risk classification.",
  "source": "policy",
  "path": "TOOLS.md",
  "line": 12,
  "ocPath": "oc://TOOLS.md/tools/deploy",
  "target": "oc://TOOLS.md/tools/deploy",
  "requirement": "oc://policy.jsonc/tools/requireMetadata"
}
```

```json
{
  "checkId": "policy/mcp-unapproved-server",
  "severity": "error",
  "message": "MCP server 'remote' is not in the policy allowlist.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/mcp/servers/remote",
  "target": "oc://openclaw.config/mcp/servers/remote",
  "requirement": "oc://policy.jsonc/mcp/servers/allow"
}
```

```json
{
  "checkId": "policy/models-unapproved-provider",
  "severity": "error",
  "message": "Model ref 'anthropic/claude-sonnet-4.7' uses unapproved provider 'anthropic'.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "target": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "requirement": "oc://policy.jsonc/models/providers/allow"
}
```

```json
{
  "checkId": "policy/network-private-access-enabled",
  "severity": "error",
  "message": "Network setting 'browser-private-network' allows private-network access.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "target": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "requirement": "oc://policy.jsonc/network/privateNetwork/allow"
}
```

```json
{
  "checkId": "policy/gateway-non-loopback-bind",
  "severity": "error",
  "message": "Gateway bind setting 'gateway-bind' permits non-loopback exposure.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/bind",
  "target": "oc://openclaw.config/gateway/bind",
  "requirement": "oc://policy.jsonc/gateway/exposure/allowNonLoopbackBind"
}
```

```json
{
  "checkId": "policy/gateway-node-command-denied",
  "severity": "error",
  "message": "Gateway node command 'system.run' is denied by policy but not denied by OpenClaw config.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/nodes/denyCommands",
  "target": "oc://openclaw.config/gateway/nodes/denyCommands",
  "requirement": "oc://policy.jsonc/gateway/nodes/denyCommands",
  "fixHint": "Add 'system.run' to gateway.nodes.denyCommands or update policy after review."
}
```

```json
{
  "checkId": "policy/agents-workspace-access-denied",
  "severity": "error",
  "message": "agents.defaults sandbox workspaceAccess 'rw' is not allowed by policy.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "target": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "requirement": "oc://policy.jsonc/agents/workspace/allowedAccess"
}
```

## الإصلاح

الخياران `doctor --lint` و`policy check` مخصّصان للقراءة فقط.

لا يعدّل `doctor --fix` إعدادات مساحة العمل المُدارة بالسياسة إلا عند تمكين
`workspaceRepairs` صراحةً؛ وإلا فستُبلغ عمليات التحقق عمّا كانت ستُصلحه
وتترك الإعدادات دون تغيير.

في هذا الإصدار، يمكن للإصلاح تعطيل القنوات المحظورة بواسطة `channels.denyRules`
وتطبيق إصلاحات التضييق التلقائية المدرجة أدناه. لا تُمكّن `workspaceRepairs`
إلا بعد مراجعة ملف السياسة، لأن القاعدة الصالحة قد تغيّر إعدادات
مساحة العمل:

- اضبط `tools.elevated.enabled=false` عندما تحظر سياسة عامة الأدوات ذات الصلاحيات المرتفعة
- أضف معرّفات الأدوات المفقودة والمطلوب حظرها إلى `tools.deny` أو
  `agents.list[].tools.deny` عندما تتطلب السياسة حظر تلك الأدوات
- اضبط مفاتيح التبديل غير الآمنة في `gateway.controlUi.*` على `false`
- اضبط `gateway.mode=local` عندما تحظر السياسة وضع Gateway البعيد
- اضبط مسارات `gateway.http.endpoints.*.enabled` المُبلّغ عنها على `false` عندما تحظر السياسة
  نقاط نهاية واجهة HTTP البرمجية لـ Gateway
- اضبط مسارات `groupPolicy` المُبلّغ عنها لاستقبال القناة على `allowlist` عندما تحظر السياسة
  استقبال المجموعات المفتوح
- اضبط مسارات `requireMention` المُبلّغ عنها لاستقبال القناة على `true` عندما تتطلب السياسة
  الإشارات في المجموعات
- اضبط `logging.redactSensitive=tools` عندما تتطلب السياسة حجب البيانات الحساسة
  في السجلات
- اضبط `diagnostics.otel.captureContent=false`، أو
  `diagnostics.otel.captureContent.enabled=false` لإعدادات التقاط بيانات القياس عن بُعد
  ذات صيغة الكائن، عندما تحظر السياسة التقاط محتوى بيانات القياس عن بُعد

تقتصر إصلاحات الأدوات ذات الصلاحيات المرتفعة المحددة النطاق على الاكتشاف فقط. كما
تُتخطى إصلاحات معالجة البيانات المحددة النطاق عندما تُبلغ النتيجة عن إعدادات مشتركة
للسجلات أو بيانات القياس عن بُعد، لأن تغيير الإعداد المشترك سيؤثر في نطاق أوسع من هدف
السياسة المحدد النطاق.

تُتخطى إصلاحات الحظر المطلوب المحددة النطاق عندما تُبلغ النتيجة عن
`tools.deny` الجذرية الموروثة، لأن إضافة الأداة المطلوبة إلى إعدادات الجذر ستؤثر
في نطاق أوسع من هدف السياسة المحدد النطاق. يمكن لإصلاحات الحظر المطلوب المحلية للوكيل تحديث
مسار `agents.list[].tools.deny` المُبلّغ عنه.

تُتخطى إصلاحات استقبال القناة المحددة النطاق عندما تُبلغ النتيجة عن
`channels.defaults.*` الموروثة، لأن تغيير الإعداد الافتراضي المشترك للقناة سيؤثر
في نطاق أوسع من هدف السياسة المحدد النطاق. تظل نتائج قائمة السماح لجلب عناوين URL
عبر HTTP في Gateway يدوية، لأن الإصلاح التلقائي لا يستطيع اختيار قيم قائمة السماح
الصحيحة لعناوين URL لنقاط النهاية.

تظل نتائج ربط Gateway وأوامر Node بحاجة إلى المراجعة. عندما يمكن تعيين
`policy/gateway-non-loopback-bind` أو `policy/gateway-node-command-denied`
إلى مسار إعدادات، يُبلغ `doctor --fix` عن تغيير `gateway.bind` أو
`gateway.nodes.denyCommands` المقترح بوصفه إرشادًا لمعاينة تم تخطيها.
ولا يطبّق التغيير، ولا تُحتسب النتيجة على أنها أُصلحت حتى يراجع المشغّل
الإعدادات أو السياسة ويحدّثها.

```jsonc
{
  "plugins": {
    "entries": {
      "policy": {
        "config": {
          "workspaceRepairs": true,
        },
      },
    },
  },
}
```

## رموز الخروج

| الأمر             | `0`                                                        | `1`                                                                    | `2`                             |
| ---------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------- |
| `policy check`   | لا توجد نتائج عند الحد المحدد.                             | استوفت نتيجة واحدة أو أكثر الحد المحدد.                                | فشل في الوسيطات أو وقت التشغيل. |
| `policy compare` | ملف السياسة صارم بقدر خط الأساس على الأقل.                 | ملف السياسة غير صالح أو مفقود أو أضعف من قواعد خط الأساس.              | فشل في الوسيطات أو وقت التشغيل. |
| `policy watch`   | لا توجد نتائج، والتجزئة المقبولة محدّثة.                   | توجد نتائج أو أن الإقرار المقبول قديم.                                 | فشل في الوسيطات أو وقت التشغيل. |

## ذو صلة

- [وضع التدقيق في Doctor](/ar/cli/doctor#lint-mode)
- [CLI للمسارات](/ar/cli/path)
