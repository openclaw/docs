---
read_when:
    - تريد التحقق من إعدادات OpenClaw مقابل ملف policy.jsonc مؤلَّف
    - تريد ملاحظات السياسة في doctor lint
    - تحتاج إلى تجزئة إقرار السياسة لأدلة التدقيق
summary: مرجع CLI لفحوصات مطابقة `openclaw policy`
title: السياسة
x-i18n:
    generated_at: "2026-06-27T17:23:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5af65bb34aeed72bbb348a56195d65152dce1e8d0e7236da8d8681e56c9b32f4
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

يوفّر Plugin السياسة المضمّن الأمر `openclaw policy`. السياسة هي طبقة
امتثال مؤسسية فوق إعدادات OpenClaw الحالية. وهي لا تضيف نظام إعدادات ثانيا.
يعرّف `policy.jsonc` المتطلبات المؤلّفة، ويراقب OpenClaw مساحة العمل النشطة
كدليل، وتبلّغ فحوصات صحة السياسة عن الانحراف عبر `doctor --lint`. إشارة
الامتثال النهائية هي تشغيل نظيف لـ `doctor --lint`؛ وتساهم السياسة بالنتائج
في سطح الفحص المشترك هذا بدلا من إنشاء بوابة صحة منفصلة.

تدير السياسة حاليا القنوات المضبوطة، وخوادم MCP، وموفّري النماذج،
ووضعية SSRF للشبكة، ووضعية وصول الدخول/القنوات، ووضعية تعريض Gateway، ووضعية مساحة عمل الوكيل،
ووضعية معالجة البيانات، ووضعية موفّر أسرار إعدادات OpenClaw/ملف تعريف المصادقة، وتصريحات الأدوات
الخاضعة للحوكمة. على سبيل المثال، يمكن لفريق تقنية المعلومات أو مشغّل مساحة العمل تسجيل أن Telegram
ليس موفّر قنوات معتمدا، وتقييد خوادم MCP ومراجع النماذج إلى
إدخالات معتمدة، وطلب بقاء وصول الجلب/المتصفح إلى الشبكات الخاصة
معطلا، وطلب بقاء عزل جلسات الرسائل المباشرة ووضعية دخول القنوات
ضمن حدود تمت مراجعتها، وطلب بقاء ربط Gateway/المصادقة/تعريض HTTP ضمن حدود تمت مراجعتها،
وطلب بقاء وصول مساحة عمل الوكيل ورفض الأدوات في وضعية تمت مراجعتها،
وطلب استخدام SecretRefs في إعدادات OpenClaw لموفّرين مدارين، وطلب
أن تحمل ملفات تعريف مصادقة الإعدادات بيانات وصفية للموفّر/الوضع، وطلب
أن تحمل الأدوات الخاضعة للحوكمة بيانات وصفية للمخاطر والحساسية، وطلب
تنقيح السجلات الحساسة، ورفض التقاط محتوى القياسات، وطلب صيانة احتفاظ الجلسات،
ورفض فهرسة ذاكرة نصوص الجلسات، ثم استخدام `doctor --lint` كبوابة
الامتثال المشتركة.

استخدم السياسة عندما تحتاج مساحة العمل إلى بيان دائم مثل "يجب ألا تكون هذه القنوات
ممكّنة" أو "يجب أن تصرّح الأدوات الخاضعة للحوكمة ببيانات وصفية للموافقة" وإلى
طريقة قابلة للتكرار لإثبات أن OpenClaw لا يزال ممتثلا لذلك البيان. استخدم
الإعدادات العادية ووثائق مساحة العمل وحدها عندما تحتاج فقط إلى سلوك محلي ولا
تحتاج إلى نتائج سياسة أو مخرجات إقرار.

## البدء السريع

فعّل Plugin السياسة المضمّن قبل أول استخدام:

```bash
openclaw plugins enable policy
```

عند تمكين السياسة، يمكن لـ doctor تحميل فحوصات صحة السياسة دون تفعيل
Plugins عشوائية. يبقى Plugin ممكنا إذا كان `policy.jsonc` مفقودا، بحيث
يتمكن doctor من الإبلاغ عن الأثر المفقود.

السياسة مؤلّفة، وليست مولّدة من إعدادات المستخدم الحالية. تبدو سياسة
صغرى للقنوات، وخوادم MCP، وموفّري النماذج، ووضعية الشبكة، ووصول الدخول/القنوات، وتعريض Gateway،
ووضعية مساحة عمل الوكيل، ووضعية وقت تشغيل sandbox المضبوطة، ووضعية
معالجة بيانات OpenClaw، ووضعية موفّر أسرار الإعدادات/ملف تعريف المصادقة، ووضعية
ملف موافقات exec، وبيانات الأدوات الوصفية كما يلي:

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

القواعد هي المرجع الحاكم. كتلة الفئة ليست إلا مساحة أسماء؛ تعمل الفحوصات
عند وجود قاعدة ملموسة. يقرأ OpenClaw إعدادات `channels.*` الحالية
و`mcp.servers.*` و`models.providers.*` ومراجع نماذج وكلاء محددة، وإعدادات SSRF
للشبكة، ونطاق جلسات الرسائل المباشرة، وسياسة الرسائل المباشرة للقناة، وسياسة مجموعات القنوات،
وبوابات الإشارة في القنوات/المجموعات، ووضعية ربط Gateway/المصادقة/Control UI/Tailscale/البعيد/HTTP،
ووضعية وصول مساحة عمل sandbox لوكيل إعدادات OpenClaw ورفض الأدوات،
ووضعية إعدادات معالجة البيانات، ومصدر موفّر
الأسرار وSecretRef في الإعدادات، والبيانات الوصفية لملف تعريف مصادقة الإعدادات، ووضعية
الأدوات العامة/لكل وكيل المضبوطة، وتصريحات `TOOLS.md` كدليل، ثم
يبلّغ عن الحالة المرصودة التي لا تمتثل. إذا كانت سياسة تمنع عمليات ربط Gateway
غير local loopback، فلا تحذف `gateway.bind` إلا عندما تكون
مستعدا لمراجعة القيمة الافتراضية وقت التشغيل؛ عيّن `gateway.bind=loopback` من أجل
امتثال صارم للإعدادات. بالنسبة إلى وضعية الوكيل للقراءة فقط، اضبط وضع sandbox
على القيم الافتراضية أو الوكيل المعني وعيّن `workspaceAccess` إلى `none` أو
`ro`؛ وضع sandbox المحذوف أو `off` لا يفي بسياسة القراءة فقط/عدم الكتابة.
يدعم `agents.workspace.denyTools` القيم `exec` و`process` و`write` و
`edit` و`apply_patch`؛ ويغطي `group:fs` في إعدادات OpenClaw أدوات تعديل الملفات
ويغطي `group:runtime` أدوات shell/process. تراقب سياسة وضعية الأدوات
`tools.profile` و`tools.allow` و`tools.alsoAllow` و`tools.deny` و
`tools.fs.workspaceOnly` و`tools.exec.security` و`tools.exec.ask` و
`tools.exec.host` و`tools.elevated.enabled`، بالإضافة إلى تجاوزات
`agents.list[].tools.*` نفسها لكل وكيل. تقرأ سياسة موافقات exec أثر المنتج
`exec-approvals.json` المسمى فقط عند وجود قاعدة `execApprovals`؛ وتسجل الأدلة
القيم الافتراضية، ووضعية كل وكيل، وأنماط allowlist
دون رموز socket أو نص آخر أمر مستخدم. لا تفرض السياسة نداءات الأدوات
وقت التشغيل. تسجل أدلة الأسرار
وضعية الموفّر/المصدر وبيانات SecretRef الوصفية، وليس قيم الأسرار الخام أبدا. لا
تقرأ السياسة ولا تقرّ مخازن بيانات الاعتماد لكل وكيل مثل `auth-profiles.json`؛
تبقى هذه المخازن مملوكة لتدفقات المصادقة وبيانات الاعتماد الحالية.
أدلة معالجة البيانات هي وضعية على مستوى الإعدادات فقط: فهي تفحص وضع التنقيح
المضبوط، ومفاتيح التقاط محتوى القياسات، ووضع صيانة الجلسات، وإعدادات
فهرسة ذاكرة نصوص الجلسات. ولا تفحص السجلات الخام،
أو صادرات القياسات، أو محتويات النصوص، أو ملفات الذاكرة، ولا تثبت عدم وجود
بيانات شخصية أو أسرار.

### مرجع قواعد السياسة

كل حقل سياسة أدناه اختياري. لا يعمل الفحص إلا عند وجود القاعدة المطابقة
في `policy.jsonc`. الحالة المرصودة هي إعدادات OpenClaw الحالية أو
بيانات مساحة العمل الوصفية؛ تبلّغ السياسة عن الانحراف لكنها لا تعيد كتابة سلوك وقت التشغيل
ما لم يكن مسار إصلاح متاحا وممكنا صراحة.
ملفات السياسة صارمة: يتم الإبلاغ عن الأقسام أو مفاتيح القواعد غير المدعومة باسم
`policy/policy-jsonc-invalid` بدلا من تجاهلها.

تُبقي تراكبات السياسة القواعد العامة واسعة المستوى في الأعلى، ثم تتيح لكتل النطاق المسماة
إضافة أقسام سياسة عادية أكثر صرامة للمحددات الصريحة. اسم النطاق
مجرد دلو وصفي؛ وتستخدم المطابقة قيم المحددات داخل النطاق.
التراكب إضافي: تظل المطالبات العامة تعمل، ويمكن للمطالبة محددة النطاق إصدار
نتيجتها الخاصة ضد الإعداد المرصود نفسه.

#### التراكبات محددة النطاق

استخدم `scopes.<scopeName>` عندما تحتاج مجموعة من الوكلاء أو القنوات إلى
سياسة أكثر صرامة من خط الأساس الأعلى مستوى. تستخدم الأقسام محددة النطاق للوكيل `agentIds`، والتي
تدعم `tools.*` و`agents.workspace.*` و`sandbox.*` و`dataHandling.memory.*`
و`execApprovals.*`. يستخدم دخول القنوات محدد النطاق
`channelIds`، والذي يدعم `ingress.channels.*`. يتم رفض الأقسام غير المدعومة
بدلا من تجاهلها. إذا لم يكن إدخال `agentIds` موجودا
في `agents.list[]`، يقيّم OpenClaw القاعدة محددة النطاق مقابل
الوضعية العامة/الافتراضية الموروثة لمعرّف وكيل وقت التشغيل ذلك.

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

يمكن أن يظهر الوكيل نفسه في نطاقات متعددة عندما يحكم كل نطاق حقولا مختلفة،
كما هو موضح أعلاه. يجب أن يكون الحقل محدد النطاق المكرر للوكيل نفسه
مساويا في الصرامة أو أشد وفقا لبيانات السياسة الوصفية؛ ويتم رفض
المطالبات المكررة الأضعف. تتعامل بيانات الصرامة الوصفية مع قوائم السماح كمجموعات فرعية،
وقوائم الرفض كمجموعات فائقة، والقيم المنطقية المطلوبة كمتطلبات ثابتة.

لا تُقيّم سياسة وضعية الحاويات إلا مقابل الأدلة التي يستطيع OpenClaw
رصدها للوكيل المطابق. إذا انطبقت قاعدة `sandbox.containers.*` ممكّنة
على وكيل لا يستطيع backend الخاص بـ sandbox لديه كشف ذلك الحقل، تبلّغ السياسة عن
`policy/sandbox-container-posture-unobservable` بدلا من اعتبار المطالبة
ناجحة. استخدم نطاقات `agentIds` منفصلة لمجموعات الوكلاء التي تستخدم backends
sandbox مختلفة، واترك قواعد الحاويات غير المدعومة غير معيّنة أو false للمجموعات
التي لا يمكن فيها رصد تلك الحقول.

يبقى `ingress.session.requireDmScope` الأعلى مستوى عاما لأن
`session.dmScope` ليس دليلا منسوبا إلى قناة.

| المحدِّد     | الأقسام المدعومة                                                                 | يُستخدم عندما                                          |
| ------------ | ---------------------------------------------------------------------------------- | ------------------------------------------------- |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory`, and `execApprovals` | يحتاج وكيل تشغيل واحد أو أكثر إلى قواعد أكثر صرامة.   |
| `channelIds` | `ingress.channels`                                                                 | تحتاج قناة واحدة أو أكثر إلى قواعد دخول أكثر صرامة. |

يجب أن يكون كل نطاق موجود في `policy.jsonc` صالحًا وقابلًا للإنفاذ.

#### القنوات

| حقل السياسة                         | الحالة المرصودة                          | يُستخدم عندما                                                     |
| ------------------------------------ | --------------------------------------- | ------------------------------------------------------------ |
| `channels.denyRules[].when.provider` | موفّر `channels.*` وحالة التفعيل | رفض القنوات المكوّنة من موفّر مثل `telegram`. |
| `channels.denyRules[].reason`        | سياق رسالة النتيجة وتلميح الإصلاح | شرح سبب رفض الموفّر.                          |

#### خوادم MCP

| حقل السياسة        | الحالة المرصودة      | يُستخدم عندما                                                   |
| ------------------- | ------------------- | ---------------------------------------------------------- |
| `mcp.servers.allow` | معرّفات `mcp.servers.*` | اشتراط أن يكون كل خادم MCP مكوّن ضمن قائمة سماح. |
| `mcp.servers.deny`  | معرّفات `mcp.servers.*` | رفض معرّفات خوادم MCP مكوّنة معيّنة.                   |

#### موفّرو النماذج

| حقل السياسة             | الحالة المرصودة                                   | يُستخدم عندما                                                                        |
| ------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `models.providers.allow` | معرّفات `models.providers.*` ومراجع النماذج المحددة | اشتراط استخدام الموفّرين المكوّنين ومراجع النماذج المحددة لموفّرين معتمدين. |
| `models.providers.deny`  | معرّفات `models.providers.*` ومراجع النماذج المحددة | رفض الموفّرين المكوّنين ومراجع النماذج المحددة حسب معرّف الموفّر.               |

#### الشبكة

| حقل السياسة                   | الحالة المرصودة                      | يُستخدم عندما                                                           |
| ------------------------------ | ----------------------------------- | ------------------------------------------------------------------ |
| `network.privateNetwork.allow` | مخارج تجاوز SSRF للشبكة الخاصة | اضبطه على `false` لاشتراط بقاء الوصول إلى الشبكة الخاصة معطّلًا. |

#### الدخول والوصول إلى القنوات

| حقل السياسة                              | الحالة المرصودة                                                 | يُستخدم عندما                                                           |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------ |
| `ingress.session.requireDmScope`          | `session.dmScope`                                              | اشتراط نطاق عزل رسائل مباشرة مُراجع.                 |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` وحقول سياسة الرسائل المباشرة القديمة للقنوات      | السماح فقط بسياسات قنوات الرسائل المباشرة المُراجعة.               |
| `ingress.channels.denyOpenGroups`         | سياسة دخول القنوات والحسابات والمجموعات                     | رفض دخول المجموعات المفتوحة للقنوات والحسابات المكوّنة.      |
| `ingress.channels.requireMentionInGroups` | إعداد بوابة الإشارة للقنوات والحسابات والمجموعات والنقابات والمتداخلة | اشتراط بوابات الإشارة عندما يكون دخول المجموعات مفتوحًا أو مقيّدًا بالإشارة. |

#### Gateway

| حقل السياسة                            | الحالة المرصودة                                 | يُستخدم عندما                                                     |
| --------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------ |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                 | اضبطه على `false` لاشتراط ربط Gateway بعنوان loopback.          |
| `gateway.exposure.allowTailscaleFunnel` | وضع خدمة/نفق Tailscale لـ Gateway         | اضبطه على `false` لرفض تعريض Tailscale Funnel.            |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                            | اضبطه على `true` لرفض مصادقة Gateway المعطّلة.               |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                       | اضبطه على `true` لاشتراط إعداد صريح لحدّ معدل المصادقة.    |
| `gateway.controlUi.allowInsecure`       | مفاتيح تبديل المصادقة/الجهاز/الأصل غير الآمنة في واجهة التحكم | اضبطه على `false` لرفض مفاتيح تبديل تعريض واجهة التحكم غير الآمنة. |
| `gateway.remote.allow`                  | وضع/إعداد Gateway البعيد                     | اضبطه على `false` لرفض وضع Gateway البعيد.                  |
| `gateway.http.denyEndpoints`            | نقاط نهاية واجهة HTTP API لـ Gateway                     | رفض معرّفات نقاط النهاية مثل `chatCompletions` أو `responses`.  |
| `gateway.http.requireUrlAllowlists`     | مدخلات جلب عناوين URL عبر HTTP في Gateway                  | اضبطه على `true` لاشتراط قوائم سماح لعناوين URL على مدخلات جلب عناوين URL. |

#### مساحة عمل الوكيل

| حقل السياسة                     | الحالة المرصودة                                                                        | يُستخدم عندما                                                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` و`agents.list[].sandbox.workspaceAccess` | السماح فقط بقيم وصول مساحة عمل sandbox مثل `none` أو `ro`.                                                  |
| `agents.workspace.denyTools`     | إعداد رفض الأدوات العام ولكل وكيل                                                 | اشتراط رفض أدوات تعديل مساحة العمل/التشغيل مثل `exec` أو `process` أو `write` أو `edit` أو `apply_patch`. |

#### وضعية Sandbox

| حقل السياسة                                          | الحالة المرصودة                                          | يُستخدم عندما                                                       |
| ----------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| `sandbox.requireMode`                                 | `agents.defaults.sandbox.mode` والوضع لكل وكيل       | السماح فقط بأوضاع sandbox المُراجعة مثل `all` أو `non-main`. |
| `sandbox.allowBackends`                               | `agents.defaults.sandbox.backend` والخلفية لكل وكيل | السماح فقط بخلفيات sandbox المُراجعة مثل `docker`.         |
| `sandbox.containers.denyHostNetwork`                  | وضع شبكة sandbox/المتصفح المدعوم بالحاويات           | رفض وضع شبكة المضيف.                                        |
| `sandbox.containers.denyContainerNamespaceJoin`       | وضع شبكة sandbox/المتصفح المدعوم بالحاويات           | رفض الانضمام إلى نطاق أسماء شبكة حاوية أخرى.              |
| `sandbox.containers.requireReadOnlyMounts`            | وضع تركيب sandbox/المتصفح المدعوم بالحاويات             | اشتراط أن تكون التركيبات للقراءة فقط.                                |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | أهداف تركيب sandbox/المتصفح المدعوم بالحاويات          | رفض تركيبات مقبس تشغيل الحاويات.                          |
| `sandbox.containers.denyUnconfinedProfiles`           | وضعية ملف تعريف أمان الحاوية                      | رفض ملفات تعريف أمان الحاويات غير المقيّدة.                   |
| `sandbox.browser.requireCdpSourceRange`               | نطاق مصدر CDP لمتصفح sandbox                        | اشتراط أن يعلن تعريض CDP للمتصفح عن نطاق مصدر.        |

تتعامل السياسة مع غياب `sandbox.mode` باعتباره الافتراضي الضمني `off`، لذلك
يبلّغ `sandbox.requireMode` عن sandbox جديد أو غير مكوّن على أنه خارج
قائمة سماح مثل `["all"]`.

#### معالجة البيانات

| حقل السياسة                                        | الحالة المرصودة                                                                       | يُستخدم عندما                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                            | اضبطه على `true` لرفض `logging.redactSensitive: "off"`.              |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                    | اضبطه على `true` لرفض التقاط محتوى القياسات عن بُعد.                     |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                           | اضبطه على `true` لاشتراط وضع صيانة جلسة فعّال `enforce`. |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` و`agents.*.memorySearch.experimental.sessionMemory` | اضبطه على `true` لرفض فهرسة نصوص الجلسات في الذاكرة.       |

#### الأسرار

| حقل السياسة                      | الحالة المرصودة                                           | يُستخدم عندما                                                                |
| --------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| `secrets.requireManagedProviders` | إعلانات SecretRefs و`secrets.providers.*` في الإعداد | اضبطه على `true` لاشتراط أن تشير SecretRefs إلى موفّرين مُعلنين.     |
| `secrets.denySources`             | مصادر موفّري الأسرار ومصادر SecretRef            | رفض مصادر مثل `exec` أو `file` أو اسم مصدر مكوّن آخر. |
| `secrets.allowInsecureProviders`  | علامات وضعية موفّر الأسرار غير الآمنة                   | اضبطه على `false` لرفض الموفّرين الذين يختارون وضعية غير آمنة.      |

#### موافقات exec

تراقب سياسة موافقات exec أداة التشغيل النشطة `exec-approvals.json`.
افتراضيًا، تكون هذه `~/.openclaw/exec-approvals.json`؛ وعند ضبط
`OPENCLAW_STATE_DIR`، تقرأ السياسة
`$OPENCLAW_STATE_DIR/exec-approvals.json`. تتطلب قواعد الوضعية الفعلية مثل
`execApprovals.defaults.*` أو `execApprovals.agents.*` دليل أداة قابلًا للقراءة؛
ويُبلّغ عن الأداة المفقودة أو غير الصالحة كدليل غير قابل للرصد
بدلًا من أن تصبح نجاحًا بأفضل جهد مقابل افتراضيات تشغيل تركيبية. بمجرد
أن تصبح الأداة قابلة للقراءة، ترث حقول الموافقة المحذوفة افتراضيات التشغيل: يكون
`defaults.security` المفقود هو `full`، ويرث أمان الوكيل المفقود ذلك
الافتراضي. تشمل الأدلة `defaults` و`agents.*` و
`agents.*.allowlist[].pattern` بالإضافة إلى `argPattern` اختياري، ووضعية
`autoAllowSkills` الفعّالة، ومصدر الإدخال. ولا تشمل مسار/رمز المقبس،
أو `commandText`، أو `lastUsedCommand`، أو المسارات المحلولة، أو الطوابع الزمنية.

| حقل السياسة                                | الحالة المرصودة                                                                         | يُستخدم عندما                                                                                |
| ------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                 | مسار ملف `exec-approvals.json` النشط في وقت التشغيل                                              | اضبطه على `true` لاشتراط وجود ملف الموافقات وقابلية تحليله.                     |
| `execApprovals.defaults.allowSecurity`      | `defaults.security`، مع القيمة الافتراضية `full`                                              | اسمح فقط بأوضاع أمان الموافقة الافتراضية المعتمدة.                                    |
| `execApprovals.agents.allowSecurity`        | `agents.*.security`، مع وراثة الإعدادات الافتراضية                                               | اسمح فقط بأوضاع أمان الموافقة الفعلية المعتمدة لكل وكيل.                        |
| `execApprovals.agents.allowAutoAllowSkills` | `defaults.autoAllowSkills` و`agents.*.autoAllowSkills`، مع وراثة افتراضيات وقت التشغيل | اضبطه على `false` لاشتراط قوائم سماح يدوية صارمة من دون موافقة ضمنية على CLI الخاص بـ Skills. |
| `execApprovals.agents.allowlist.expected`   | النمط المجمع `agents.*.allowlist[]` وإدخالات `argPattern` الاختيارية               | اشترط أن تطابق قائمة سماح الموافقات مجموعة الأنماط التي تمت مراجعتها.                      |

على سبيل المثال، اشترط ملف الموافقات، وارفض الإعدادات الافتراضية المتساهلة، واسمح
فقط بوضع موافقة التنفيذ الذي تمت مراجعته للوكلاء المحددين:

```jsonc
{
  "execApprovals": {
    "requireFile": true,
    "defaults": {
      // Security modes: "deny", "allowlist", or "full".
      // This default permits only the locked-down deny posture.
      "allowSecurity": ["deny"],
    },
  },
  "scopes": {
    "restricted-shell": {
      "agentIds": ["family-agent", "groups-agent"],
      "execApprovals": {
        "agents": {
          // Selected agents may use reviewed allowlist posture, but not "full".
          "allowSecurity": ["allowlist"],
          // false means skill CLIs must appear in the reviewed allowlist instead of
          // being implicitly approved by autoAllowSkills.
          "allowAutoAllowSkills": false,
          "allowlist": {
            "expected": [
              // Simple entry: exact reviewed executable pattern with no argPattern.
              "travel-hub",
              // Constrained entry: pattern plus reviewed argument regex.
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

| حقل السياسة                    | الحالة المرصودة                               | يُستخدم عندما                                                                                   |
| ------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `auth.profiles.requireMetadata` | بيانات تعريف المزوّد والوضع في `auth.profiles.*` | اشترط مفاتيح بيانات التعريف مثل `provider` و`mode` في ملفات تعريف مصادقة الإعدادات.               |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                       | اسمح فقط بأوضاع ملف تعريف المصادقة المدعومة مثل `api_key` أو `aws-sdk` أو `oauth` أو `token`. |

#### بيانات تعريف الأداة

| حقل السياسة            | الحالة المرصودة                   | يُستخدم عندما                                                                                   |
| ----------------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| `tools.requireMetadata` | تصريحات `TOOLS.md` المحكومة | اشترط أن تصرّح الأدوات المحكومة بمفاتيح بيانات التعريف مثل `risk` أو `sensitivity` أو `owner`. |

#### وضع الأداة

| حقل السياسة                    | الحالة المرصودة                                              | يُستخدم عندما                                                                                                 |
| ------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` و`agents.list[].tools.profile`           | اسمح فقط بمعرّفات ملفات تعريف الأدوات مثل `minimal` أو `messaging` أو `coding`.                                 |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` وتجاوزات `tools.fs` لكل وكيل | اضبطه على `true` لاشتراط وضع أداة نظام الملفات المقتصر على مساحة العمل فقط.                                         |
| `tools.exec.allowSecurity`      | `tools.exec.security` وأمان التنفيذ لكل وكيل           | اسمح فقط بأوضاع أمان التنفيذ مثل `deny` أو `allowlist`.                                            |
| `tools.exec.requireAsk`         | `tools.exec.ask` ووضع طلب التنفيذ لكل وكيل                | اشترط وضع موافقة مثل `always`.                                                               |
| `tools.exec.allowHosts`         | `tools.exec.host` وتوجيه مضيف التنفيذ لكل وكيل           | اسمح فقط بأوضاع توجيه مضيف التنفيذ مثل `sandbox`.                                                    |
| `tools.elevated.allow`          | `tools.elevated.enabled` ووضع الصلاحيات المرتفعة لكل وكيل     | اضبطه على `false` لاشتراط بقاء وضع الأداة ذات الصلاحيات المرتفعة معطلاً.                                           |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` و`tools.alsoAllow` لكل وكيل           | اشترط إدخالات `alsoAllow` الدقيقة وأبلغ عن منح الأدوات الإضافية المفقودة أو غير المتوقعة.                 |
| `tools.denyTools`               | `tools.deny` و`agents.list[].tools.deny`                 | اشترط أن تتضمن قوائم رفض الأدوات المكوّنة معرّفات أدوات أو مجموعات مثل `group:runtime` و`group:fs`. |

شغّل فحوصات السياسة فقط أثناء التأليف:

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

يشغّل `policy check` مجموعة فحوصات السياسة فقط، ويُصدر الأدلة والنتائج
وتجزئات التصديق. تظهر النتائج نفسها أيضًا في `openclaw doctor --lint`
عند تمكين Plugin السياسة.

قارن ملف سياسة المشغّل بملف سياسة أساسي مؤلَّف:

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

يقارن `policy compare` صياغة ملف السياسة بصياغة ملف السياسة. ولا يفحص
حالة وقت تشغيل OpenClaw أو الأدلة أو بيانات الاعتماد أو الأسرار. يستخدم الأمر
بيانات تعريف قواعد السياسة نفسها التي تحكم التراكبات المحددة النطاق: يجب أن
تبقى قوائم السماح مساوية أو أضيق، ويجب أن تبقى قوائم الرفض مساوية أو أوسع، ويجب أن
تحافظ القيم المنطقية المطلوبة على قيمتها المطلوبة، ويجب أن تتحرك السلاسل المرتبة فقط نحو الطرف
الأكثر تقييدًا من الترتيب المكوَّن، ويجب أن تتطابق القوائم الدقيقة.

يمكن أن يكون الملف الأساسي سياسة مؤلَّفة من المؤسسة. ويمكن للسياسة المفحوصة
استخدام قيم أكثر صرامة أو إضافة قواعد سياسة إضافية. كما يمكن لقاعدة مفحوصة على المستوى الأعلى
أن تفي بقاعدة أساسية محددة النطاق عندما تكون مساوية أو أكثر تقييدًا لأن
السياسة على المستوى الأعلى تُطبق على نطاق واسع. لا يلزم أن تتطابق أسماء النطاقات؛
تُفهرس المقارنة المحددة النطاق حسب قيمة المحدِّد مثل `agentIds` أو `channelIds` وحسب
حقل السياسة الذي يتم فحصه.

مثال على مخرجات JSON نظيفة للمقارنة يبلغ فقط عن حالة مقارنة ملفات السياسة:

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

مثال على مخرجات `policy check --json` نظيفة يتضمن تجزئات مستقرة يمكن
تسجيلها بواسطة مشغّل أو مشرف:

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

## تكوين السياسة

يوجد تكوين السياسة ضمن `plugins.entries.policy.config`.

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

| الإعداد                   | الغرض                                                         |
| ------------------------- | --------------------------------------------------------------- |
| `enabled`                 | تمكين فحوصات السياسة حتى قبل وجود `policy.jsonc`.         |
| `workspaceRepairs`        | السماح لـ `doctor --fix` بتعديل إعدادات مساحة العمل المُدارة بالسياسة. |
| `expectedHash`            | قفل تجزئة اختياري لملف السياسة المعتمد.            |
| `expectedAttestationHash` | قفل تجزئة اختياري لآخر فحص سياسة نظيف تم قبوله.    |
| `path`                    | موقع ملف السياسة نسبةً إلى مساحة العمل.             |

اضبط `plugins.entries.policy.config.enabled` على `false` لتعطيل فحوصات السياسة
لمساحة عمل مع إبقاء Plugin مثبتًا.

تُؤلَّف متطلبات بيانات تعريف الأدوات في `policy.jsonc` باستخدام
`tools.requireMetadata`، على سبيل المثال `["risk", "sensitivity", "owner"]`.

## قبول حالة السياسة

مثال على مخرجات JSON:

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
        "ref": "openai/gpt-5.5",
        "provider": "openai",
        "model": "gpt-5.5",
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

تحدد بصمة السياسة أثر القاعدة المؤلَّف. تسجل كتلة الأدلة حالة OpenClaw المرصودة التي استخدمتها فحوصات السياسة. تحدد قيمة `workspace.hash` حمولة الأدلة تلك للنطاق المفحوص. تحدد بصمة النتائج مجموعة النتائج الدقيقة التي أرجعها الفحص. يسجل `checkedAt` وقت تشغيل التقييم. تحدد بصمة التصديق الادعاء الثابت: بصمة السياسة، وبصمة الأدلة، وبصمة النتائج، وما إذا كانت النتيجة نظيفة. وهي لا تتضمن `checkedAt` عمدًا، بحيث تنتج حالة السياسة نفسها التصديق نفسه عبر الفحوصات المتكررة. تشكل هذه العناصر معًا زوج التدقيق لهذا الفحص السياسي.

إذا استخدم Gateway أو مشرف لاحق السياسة لحظر إجراء وقت تشغيل أو الموافقة عليه أو إضافة تعليق توضيحي إليه، فيجب أن يسجل بصمة التصديق من آخر فحص سياسة نظيف. يبقى `checkedAt` في مخرجات JSON لسجلات التدقيق، لكنه ليس جزءًا من بصمة التصديق الثابتة.

استخدم دورة الحياة هذه عند قبول حالة السياسة:

1. ألّف أو راجع `policy.jsonc`.
2. شغّل `openclaw policy check --json`.
3. إذا كانت النتيجة نظيفة، فسجّل `attestation.policy.hash` كـ `expectedHash`.
4. سجّل `attestation.attestationHash` كـ `expectedAttestationHash`.
5. أعد تشغيل `openclaw doctor --lint` في CI أو بوابات الإصدار.

إذا تغيرت قواعد السياسة عمدًا، فحدّث كلتا البصمتين المقبولتين من فحص نظيف. إذا تغيرت إعدادات مساحة العمل عمدًا لكن السياسة بقيت كما هي، فعادةً لا يتغير إلا `expectedAttestationHash`.

يضيف تمكين قواعد `agents.workspace` أو ترقيتها أدلة `agentWorkspace` إلى بصمة مساحة العمل وبصمة التصديق. يجب على المشغلين مراجعة الأدلة الجديدة وتحديث بصمات التصديق المقبولة بعد تمكين هذه القواعد. يضيف تمكين قواعد وضعية الأدوات أو ترقيتها أدلة `toolPosture` بالطريقة نفسها.

يشغّل `openclaw policy watch` الفحص نفسه تكرارًا ويبلّغ عندما لا تعود الأدلة الحالية تطابق `expectedAttestationHash`:

```bash
openclaw policy watch --json
```

استخدم `--once` في CI أو النصوص البرمجية التي تحتاج إلى تقييم انجراف واحد فقط. من دون `--once`، يستطلع الأمر كل ثانيتين افتراضيًا؛ استخدم `--interval-ms` لاختيار فاصل زمني مختلف.

## النتائج

تتحقق السياسة حاليًا من:

| معرّف الفحص                                                 | النتيجة                                                                           |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | السياسة مفعّلة لكن `policy.jsonc` مفقود.                                  |
| `policy/policy-jsonc-invalid`                            | لا يمكن تحليل السياسة أو أنها تحتوي على إدخالات قواعد مشوّهة.                       |
| `policy/policy-hash-mismatch`                            | لا تطابق السياسة قيمة `expectedHash` المضبوطة.                                  |
| `policy/attestation-hash-mismatch`                       | لم تعد أدلة السياسة الحالية تطابق الإقرار المقبول.               |
| `policy/policy-conformance-invalid`                      | يحتوي ملف سياسة أساسي أو مفحوص على صياغة مقارنة غير صالحة.                  |
| `policy/policy-conformance-missing`                      | يفتقد ملف سياسة مفحوص قاعدة يتطلبها ملف السياسة الأساسي.     |
| `policy/policy-conformance-weaker`                       | يحتوي ملف سياسة مفحوص على قيمة أضعف من ملف السياسة الأساسي.           |
| `policy/channels-denied-provider`                        | تطابق قناة مفعّلة قاعدة منع قناة.                                   |
| `policy/mcp-denied-server`                               | يرفض السياسة خادوم MCP مضبوطًا.                                      |
| `policy/mcp-unapproved-server`                           | يقع خادوم MCP مضبوط خارج قائمة السماح.                                 |
| `policy/models-denied-provider`                          | يستخدم موفّر نموذج مضبوط أو مرجع نموذج موفّرًا مرفوضًا.                  |
| `policy/models-unapproved-provider`                      | يقع موفّر نموذج مضبوط أو مرجع نموذج خارج قائمة السماح.                |
| `policy/network-private-access-enabled`                  | منفذ تجاوز SSRF للشبكة الخاصة مفعّل بينما ترفضه السياسة.             |
| `policy/ingress-dm-policy-unapproved`                    | تقع سياسة DM لقناة خارج قائمة السماح الخاصة بالسياسة.                              |
| `policy/ingress-dm-scope-unapproved`                     | لا يطابق `session.dmScope` نطاق عزل DM الذي تتطلبه السياسة.          |
| `policy/ingress-open-groups-denied`                      | سياسة مجموعة قناة هي `open` بينما ترفض السياسة دخول المجموعات المفتوحة.          |
| `policy/ingress-group-mention-required`                  | يعطّل إدخال قناة أو مجموعة بوابات الإشارة بينما تتطلبها السياسة.       |
| `policy/gateway-non-loopback-bind`                       | تسمح وضعية ربط Gateway بالتعرّض خارج حلقة الرجوع عندما ترفضه السياسة.         |
| `policy/gateway-auth-disabled`                           | مصادقة Gateway معطّلة عندما تتطلب السياسة المصادقة.                     |
| `policy/gateway-rate-limit-missing`                      | وضعية تحديد معدل مصادقة Gateway ليست صريحة عندما تتطلبها السياسة.          |
| `policy/gateway-control-ui-insecure`                     | مفاتيح تمكين التعرّض غير الآمن لواجهة تحكم Gateway مفعّلة.                         |
| `policy/gateway-tailscale-funnel`                        | تعريض Gateway عبر Tailscale Funnel مفعّل عندما ترفضه السياسة.               |
| `policy/gateway-remote-enabled`                          | وضع Gateway البعيد نشط عندما ترفضه السياسة.                              |
| `policy/gateway-http-endpoint-enabled`                   | نقطة نهاية HTTP API في Gateway مفعّلة مع أن السياسة ترفضها.                    |
| `policy/gateway-http-url-fetch-unrestricted`             | يفتقر إدخال جلب URL عبر HTTP في Gateway إلى قائمة سماح URL مطلوبة.                      |
| `policy/agents-workspace-access-denied`                  | وضع صندوق حماية الوكيل أو وصوله إلى مساحة العمل خارج قائمة السماح الخاصة بالسياسة.           |
| `policy/agents-tool-not-denied`                          | لا يرفض وكيل أو إعداد افتراضي أداة تتطلب السياسة رفضها.               |
| `policy/tools-profile-unapproved`                        | يقع ملف تعريف أدوات عام أو خاص بوكيل خارج قائمة السماح.           |
| `policy/tools-fs-workspace-only-required`                | أدوات نظام الملفات غير مضبوطة بوضعية مسار مقتصرة على مساحة العمل.             |
| `policy/tools-exec-security-unapproved`                  | وضع أمان التنفيذ خارج قائمة السماح الخاصة بالسياسة.                               |
| `policy/tools-exec-ask-unapproved`                       | وضع طلب التنفيذ خارج قائمة السماح الخاصة بالسياسة.                                    |
| `policy/tools-exec-host-unapproved`                      | توجيه مضيف التنفيذ خارج قائمة السماح الخاصة بالسياسة.                                |
| `policy/tools-elevated-enabled`                          | وضع الأداة المرتفع مفعّل عندما ترفضه السياسة.                              |
| `policy/tools-also-allow-missing`                        | تفتقد قائمة `alsoAllow` مضبوطة إدخالًا تتطلبه السياسة.             |
| `policy/tools-also-allow-unexpected`                     | تتضمن قائمة `alsoAllow` مضبوطة إدخالًا لا تتوقعه السياسة.           |
| `policy/tools-required-deny-missing`                     | لا تتضمن قائمة منع أدوات عامة أو خاصة بوكيل أداة مرفوضة مطلوبة.     |
| `policy/sandbox-mode-unapproved`                         | وضع صندوق الحماية خارج قائمة السماح الخاصة بالسياسة.                                     |
| `policy/sandbox-backend-unapproved`                      | خلفية صندوق الحماية خارج قائمة السماح الخاصة بالسياسة.                                  |
| `policy/sandbox-container-posture-unobservable`          | قاعدة وضعية حاوية مفعّلة لخلفية لا يمكنها رصدها.         |
| `policy/sandbox-container-host-network-denied`           | يستخدم صندوق حماية أو متصفح مدعوم بحاوية وضع شبكة المضيف.                     |
| `policy/sandbox-container-namespace-join-denied`         | ينضم صندوق حماية أو متصفح مدعوم بحاوية إلى نطاق أسماء حاوية أخرى.          |
| `policy/sandbox-container-mount-mode-required`           | تركيب صندوق حماية أو متصفح مدعوم بحاوية ليس للقراءة فقط.                     |
| `policy/sandbox-container-runtime-socket-mount`          | تركيب صندوق حماية أو متصفح مدعوم بحاوية يعرّض مقبس وقت تشغيل الحاوية. |
| `policy/sandbox-container-unconfined-profile`            | ملف تعريف صندوق حماية الحاوية غير مقيّد عندما ترفضه السياسة.                    |
| `policy/sandbox-browser-cdp-source-range-missing`        | نطاق مصدر CDP لمتصفح صندوق الحماية مفقود عندما تتطلب السياسة وجوده.             |
| `policy/data-handling-redaction-disabled`                | تنقيح السجلات الحساسة معطّل عندما تتطلبه السياسة.                  |
| `policy/data-handling-telemetry-content-capture`         | التقاط محتوى القياسات عن بُعد مفعّل عندما ترفضه السياسة.                       |
| `policy/data-handling-session-retention-not-enforced`    | صيانة احتفاظ الجلسات غير مفروضة عندما تتطلبها السياسة.            |
| `policy/data-handling-session-transcript-memory-enabled` | فهرسة ذاكرة نصوص الجلسات مفعّلة عندما ترفضها السياسة.              |
| `policy/secrets-unmanaged-provider`                      | يشير SecretRef في الإعدادات إلى موفّر غير معلن ضمن `secrets.providers`.  |
| `policy/secrets-denied-provider-source`                  | يستخدم موفّر أسرار في الإعدادات أو SecretRef مصدرًا ترفضه السياسة.             |
| `policy/secrets-insecure-provider`                       | يختار موفّر أسرار وضعية غير آمنة عندما ترفضها السياسة.               |
| `policy/auth-profile-invalid-metadata`                   | يفتقد ملف تعريف مصادقة في الإعدادات بيانات وصفية صالحة للموفّر أو الوضع.                 |
| `policy/auth-profile-unapproved-mode`                    | وضع ملف تعريف مصادقة في الإعدادات خارج قائمة السماح الخاصة بالسياسة.                       |
| `policy/exec-approvals-missing`                          | تتطلب السياسة `exec-approvals.json`، لكن الأثر مفقود.               |
| `policy/exec-approvals-invalid`                          | لا يمكن تحليل أثر موافقات التنفيذ المضبوط.                          |
| `policy/exec-approvals-default-security-unapproved`      | تستخدم الإعدادات الافتراضية لموافقة التنفيذ وضع أمان خارج قائمة السماح الخاصة بالسياسة.          |
| `policy/exec-approvals-agent-security-unapproved`        | وضع أمان موافقة التنفيذ الفعّال الخاص بوكيل خارج قائمة السماح.       |
| `policy/exec-approvals-auto-allow-skills-enabled`        | يسمح وكيل موافقة تنفيذ ضمنيًا بواجهات CLI الخاصة بـ Skills تلقائيًا عندما ترفضها السياسة.   |
| `policy/exec-approvals-allowlist-missing`                | تفتقد قائمة سماح الموافقات نمطًا تتطلبه السياسة.                  |
| `policy/exec-approvals-allowlist-unexpected`             | تتضمن قائمة سماح الموافقات نمطًا لا تتوقعه السياسة.                |
| `policy/tools-missing-risk-level`                        | يفتقد تصريح أداة محكومة بيانات وصفية للمخاطر.                             |
| `policy/tools-unknown-risk-level`                        | يستخدم تصريح أداة محكومة قيمة مخاطر غير معروفة.                           |
| `policy/tools-missing-sensitivity-token`                 | يفتقد تصريح أداة محكومة بيانات وصفية للحساسية.                      |
| `policy/tools-missing-owner`                             | يفتقد تصريح أداة محكومة بيانات وصفية للمالك.                            |
| `policy/tools-unknown-sensitivity-token`                 | يستخدم تصريح أداة محكومة قيمة حساسية غير معروفة.                    |

يمكن أن تتضمن نتائج السياسة كلًا من `target` و`requirement`. يمثّل `target`
العنصر المرصود في مساحة العمل الذي لا يطابق السياسة. ويمثّل `requirement` قاعدة
السياسة المكتوبة التي جعلته نتيجة. كلتا القيمتين عناوين اليوم، وعادةً ما تكون
مسارات `oc://`، لكن أسماء الحقول تصف دورها في السياسة بدلًا من صيغة
العنوان.

مثال على نتيجة JSON:

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

مثال على نتيجة أداة:

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

مثال على نتيجة MCP:

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

مثال على نتيجة موفّر نموذج:

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

مثال على نتيجة الشبكة:

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

مثال على نتيجة كشف تعرّض Gateway:

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

مثال على نتيجة كشف مساحة عمل الوكيل:

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

`doctor --lint` و`policy check` للقراءة فقط.

لا يعدّل `doctor --fix` إلا إعدادات مساحة العمل المُدارة بالسياسة عندما يكون
`workspaceRepairs` مفعّلًا صراحةً. ومن دون هذا التفعيل الاختياري، تُبلغ فحوصات السياسة
عمّا كانت ستصلحه وتترك الإعدادات دون تغيير.

في هذا الإصدار، يمكن للإصلاح تعطيل القنوات المفعّلة في إعدادات OpenClaw
لكن المحظورة بواسطة `channels.denyRules`. فعّل `workspaceRepairs` فقط بعد
مراجعة ملف السياسة، لأن قاعدة حظر صالحة يمكنها إيقاف قناة
مهيأة:

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

| الأمر            | `0`                                                    | `1`                                                                  | `2`                            |
| ---------------- | ------------------------------------------------------ | -------------------------------------------------------------------- | ------------------------------ |
| `policy check`   | لا توجد نتائج عند العتبة.                              | استوفت نتيجة واحدة أو أكثر العتبة.                                   | فشل في الوسائط أو وقت التشغيل. |
| `policy compare` | ملف السياسة صارم بقدر خط الأساس على الأقل.             | ملف السياسة غير صالح، أو مفقود، أو أضعف من قواعد خط الأساس.          | فشل في الوسائط أو وقت التشغيل. |
| `policy watch`   | لا توجد نتائج، والتجزئة المقبولة حديثة.                | توجد نتائج أو أن التصديق المقبول قديم.                               | فشل في الوسائط أو وقت التشغيل. |

## ذات صلة

- [وضع lint في Doctor](/ar/cli/doctor#lint-mode)
- [CLI للمسارات](/ar/cli/path)
