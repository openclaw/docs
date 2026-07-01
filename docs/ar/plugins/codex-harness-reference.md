---
read_when:
    - تحتاج إلى كل حقل إعداد في حزمة Codex
    - أنت تغيّر سلوك النقل أو المصادقة أو الاكتشاف أو المهلة الزمنية لخادم التطبيق
    - أنت تصحّح أخطاء بدء تشغيل حزمة Codex، أو اكتشاف النماذج، أو عزل البيئة
summary: مرجع الإعدادات والمصادقة والاكتشاف وخادم التطبيق لحزام Codex
title: مرجع حزمة تشغيل Codex
x-i18n:
    generated_at: "2026-07-01T08:07:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 02dd72f9d85d2ea5fa45533a402d640786f17bdbe2242b7c1b8cd99405561a25
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

يغطي هذا المرجع التكوين المفصل لـPlugin `codex` المضمّن. لإعدادات الإعداد وقرارات التوجيه، ابدأ بـ
[حاضنة Codex](/ar/plugins/codex-harness).

## سطح تكوين Plugin

توجد جميع إعدادات حاضنة Codex ضمن `plugins.entries.codex.config`.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
          appServer: {
            mode: "guardian",
          },
        },
      },
    },
  },
}
```

الحقول العلوية المدعومة:

| الحقل                      | الافتراضي                  | المعنى                                                                                                                                   |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | مفعّل                  | إعدادات اكتشاف النماذج لـCodex app-server `model/list`.                                                                               |
| `appServer`                | app-server مُدار عبر stdio | إعدادات النقل، والأمر، والمصادقة، والموافقة، وsandbox، والمهلة.                                                                        |
| `codexDynamicToolsLoading` | `"searchable"`           | استخدم `"direct"` لوضع أدوات OpenClaw الديناميكية مباشرةً في سياق أدوات Codex الأولي.                                                  |
| `codexDynamicToolsExclude` | `[]`                     | أسماء أدوات OpenClaw ديناميكية إضافية لحذفها من دورات Codex app-server.                                                               |
| `codexPlugins`             | معطّل                 | دعم Plugin/app الأصلي في Codex للPlugins المنسّقة المثبتة من المصدر والمُرحّلة. راجع [Plugins Codex الأصلية](/ar/plugins/codex-native-plugins). |
| `computerUse`              | معطّل                 | إعداد Codex Computer Use. راجع [Codex Computer Use](/ar/plugins/codex-computer-use).                                                          |

## نقل app-server

افتراضيًا، يبدأ OpenClaw ملف Codex الثنائي المُدار المرفق مع Plugin
المضمّن:

```bash
codex app-server --listen stdio://
```

يبقي هذا إصدار app-server مرتبطًا بـPlugin `codex` المضمّن بدلًا من
أي Codex CLI منفصل قد يكون مثبتًا محليًا. عيّن
`appServer.command` فقط عندما تريد عمدًا تشغيل ملف تنفيذي مختلف.

بالنسبة إلى app-server قيد التشغيل بالفعل، استخدم نقل WebSocket:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

حقول `appServer` المدعومة:

| الحقل                                         | الافتراضي                                                | المعنى                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | يشغّل `"stdio"` Codex؛ ويتصل `"websocket"` بـ `url`.                                                                                                                                                                                                                                                                                                                                        |
| `command`                                     | ملف Codex الثنائي المُدار                                   | الملف التنفيذي لنقل stdio. اتركه غير مضبوط لاستخدام الملف الثنائي المُدار.                                                                                                                                                                                                                                                                                                                          |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | وسيطات نقل stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | غير مضبوط                                                  | عنوان URL لخادم تطبيق WebSocket.                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | غير مضبوط                                                  | رمز Bearer لنقل WebSocket. يقبل سلسلة حرفية أو SecretInput مثل `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | ترويسات WebSocket إضافية. تقبل قيم الترويسات سلاسل حرفية أو قيم SecretInput، مثل `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | أسماء متغيرات بيئة إضافية تُزال من عملية خادم تطبيق stdio المُنشأة بعد أن يبني OpenClaw بيئته الموروثة.                                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | غير مضبوط                                                  | جذر مساحة عمل خادم تطبيق Codex البعيد. عند ضبطه، يستنتج OpenClaw جذر مساحة العمل المحلي من مساحة عمل OpenClaw المحلولة، ويحافظ على لاحقة cwd الحالية تحت هذا الجذر البعيد، ويرسل فقط cwd النهائي لخادم التطبيق إلى Codex. إذا كان cwd خارج جذر مساحة عمل OpenClaw المحلول، يفشل OpenClaw مغلقًا بدلاً من إرسال مسار محلي لـ Gateway إلى خادم التطبيق البعيد. |
| `requestTimeoutMs`                            | `60000`                                                | مهلة استدعاءات مستوى التحكم لخادم التطبيق.                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | نافذة هدوء بعد أن يقبل Codex دورة أو بعد طلب خادم تطبيق ضمن نطاق الدورة بينما ينتظر OpenClaw `turn/completed`.                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | حارس اكتمال الخمول والتقدم المستخدم بعد تسليم أداة، أو اكتمال أداة أصلية، أو تقدم مساعد خام بعد الأداة، أو اكتمال استدلال خام، أو تقدم استدلال بينما ينتظر OpenClaw `turn/completed`. استخدم هذا لأحمال العمل الموثوقة أو الثقيلة حيث يمكن أن يبقى تركيب ما بعد الأداة هادئًا لمدة أطول من ميزانية إصدار المساعد النهائية بشكل مشروع.                                |
| `mode`                                        | `"yolo"` ما لم تمنع متطلبات Codex المحلية YOLO | إعداد مسبق لتنفيذ YOLO أو التنفيذ المُراجع بواسطة الحارس.                                                                                                                                                                                                                                                                                                                                                 |
| `approvalPolicy`                              | `"never"` أو سياسة موافقات حارس مسموح بها       | سياسة موافقة Codex الأصلية المرسلة إلى بدء الخيط والاستئناف والدورة.                                                                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` أو صندوق رمل حارس مسموح به  | وضع صندوق رمل Codex الأصلي المرسل إلى بدء الخيط والاستئناف. تضيّق صناديق رمل OpenClaw النشطة دورات `danger-full-access` إلى `workspace-write` في Codex؛ ويتبع علم شبكة الدورة خروج صندوق رمل OpenClaw.                                                                                                                                                                                       |
| `approvalsReviewer`                           | `"user"` أو مراجع حارس مسموح به               | استخدم `"auto_review"` للسماح لـ Codex بمراجعة مطالبات الموافقة الأصلية عند السماح بذلك.                                                                                                                                                                                                                                                                                                                   |
| `defaultWorkspaceDir`                         | دليل العملية الحالي                              | مساحة العمل المستخدمة بواسطة `/codex bind` عند حذف `--cwd`.                                                                                                                                                                                                                                                                                                                                        |
| `serviceTier`                                 | غير مضبوط                                                  | مستوى خدمة اختياري لخادم تطبيق Codex. يفعّل `"priority"` توجيه الوضع السريع، ويطلب `"flex"` معالجة مرنة، ويمسح `null` التجاوز. يُقبل `"fast"` القديم كـ `"priority"`.                                                                                                                                                                                                 |
| `networkProxy`                                | معطّل                                               | الاشتراك في تشبيك ملف تعريف أذونات Codex لأوامر خادم التطبيق. يعرّف OpenClaw إعداد `permissions.<profile>.network` المحدد ويختاره باستخدام `default_permissions` بدلاً من إرسال `sandbox`.                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | اشتراك تجريبي للمعاينة يسجّل بيئة Codex مدعومة بصندوق رمل OpenClaw مع خادم تطبيق Codex 0.132.0 أو أحدث بحيث يمكن لتنفيذ Codex الأصلي العمل داخل صندوق رمل OpenClaw النشط.                                                                                                                                                                                                         |

`appServer.networkProxy` صريح لأنه يغيّر عقد صندوق رمل Codex.
عند تفعيله، يضبط OpenClaw أيضًا `features.network_proxy.enabled` و
`default_permissions` في إعداد خيط Codex حتى يتمكن ملف تعريف الأذونات
المُولّد من بدء التشبيك المُدار من Codex. افتراضيًا، يولّد OpenClaw اسم
ملف تعريف مقاومًا للتصادم `openclaw-network-<fingerprint>` من متن
ملف التعريف؛ استخدم `profileName` فقط عندما يكون اسم محلي ثابت مطلوبًا.

```js
export default {
  plugins: {
    entries: {
      codex: {
        config: {
          appServer: {
            sandbox: "workspace-write",
            networkProxy: {
              enabled: true,
              domains: {
                "api.openai.com": "allow",
                "blocked.example.com": "deny",
              },
              allowUpstreamProxy: true,
              proxyUrl: "http://127.0.0.1:3128",
            },
          },
        },
      },
    },
  },
};
```

إذا كان وقت تشغيل خادم التطبيق العادي سيكون `danger-full-access`، فإن تفعيل
`networkProxy` يستخدم وصولًا إلى نظام الملفات على نمط مساحة العمل لملف
تعريف الأذونات المُولّد. إن فرض الشبكة المُدار من Codex هو تشبيك محصور
بصندوق رمل، لذلك لن يحمي ملف تعريف الوصول الكامل حركة المرور الصادرة.

يحظر Plugin مصافحات خادم التطبيق الأقدم أو غير المرقّمة. يجب أن يبلّغ خادم تطبيق Codex
عن إصدار مستقر `0.125.0` أو أحدث.

يعامل OpenClaw عناوين URL لخوادم تطبيق WebSocket غير loopback كعناوين بعيدة، ويتطلب
مصادقة WebSocket تحمل الهوية عبر `appServer.authToken` أو ترويسة
`Authorization`. يمكن أن يكون `appServer.authToken` وكل قيمة `appServer.headers.*`
من نوع SecretInput؛ إذ يحل وقت تشغيل الأسرار SecretRefs واختصار env
قبل أن يبني OpenClaw خيارات بدء خادم التطبيق، وتفشل SecretRefs
المنظمة غير المحلولة قبل إرسال أي رمز مميز أو ترويسة. عند تكوين Plugins أصلية لـ Codex،
يستخدم OpenClaw مستوى التحكم في Plugin الخاص بخادم التطبيق المتصل
لتثبيت تلك Plugins أو تحديثها، ثم يحدّث مخزون التطبيقات لكي تظهر
التطبيقات المملوكة لـ Plugin في سلسلة Codex. يظل `app/list`
مصدر المخزون والبيانات الوصفية المعتمد، لكن سياسة OpenClaw تقرر ما إذا كان
`thread/start` يرسل `config.apps[appId].enabled = true` لتطبيق مدرج يمكن الوصول إليه
حتى إذا كان Codex يضع عليه علامة معطل حاليا. تبقى معرفات التطبيقات غير المعروفة أو المفقودة
مغلقة عند الفشل؛ فهذا المسار لا يفعّل إلا Plugins السوق عبر `plugin/install`
ويحدّث المخزون. لا تصل OpenClaw إلا بخوادم تطبيق بعيدة موثوقة
لقبول تثبيت Plugins التي يديرها OpenClaw وتحديثات مخزون التطبيقات.

## أوضاع الموافقة وصندوق العزل

تستخدم جلسات خادم التطبيق المحلية عبر stdio وضع YOLO افتراضيا:
`approvalPolicy: "never"`، و`approvalsReviewer: "user"`، و
`sandbox: "danger-full-access"`. تتيح وضعية المشغل المحلي الموثوق هذه
لدورات OpenClaw غير المراقبة و Heartbeats التقدم دون مطالبات موافقة أصلية
لا يوجد أحد للرد عليها.

إذا كان ملف متطلبات النظام المحلي في Codex لا يسمح بقيم موافقة YOLO
أو المراجع أو صندوق العزل الضمنية، يتعامل OpenClaw مع الافتراضي الضمني كحارس
بدلا من ذلك، ويختار أذونات الحارس المسموح بها. كما يفرض
`tools.exec.mode: "auto"` موافقات Codex بمراجعة الحارس، ولا يحافظ على
تجاوزات `approvalPolicy: "never"` أو `sandbox: "danger-full-access"` القديمة غير الآمنة؛
اضبط `tools.exec.mode: "full"` لوضع مقصود بلا موافقة.
تُحترم إدخالات
`[[remote_sandbox_config]]` المطابقة لاسم المضيف في ملف المتطلبات نفسه
عند اتخاذ قرار صندوق العزل الافتراضي.

اضبط `appServer.mode: "guardian"` لموافقات Codex بمراجعة الحارس:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

يتوسع الإعداد المسبق `guardian` إلى `approvalPolicy: "on-request"`،
و`approvalsReviewer: "auto_review"`، و`sandbox: "workspace-write"` عندما تكون هذه
القيم مسموحا بها. تتجاوز حقول السياسة الفردية `mode`. ما تزال قيمة المراجع الأقدم
`guardian_subagent` مقبولة كاسم مستعار للتوافق، لكن يجب أن تستخدم
التكوينات الجديدة `auto_review`.

عندما يكون صندوق عزل OpenClaw نشطا، تظل عملية خادم تطبيق Codex المحلية
تعمل على مضيف Gateway. لذلك يعطّل OpenClaw وضع Code Mode الأصلي في Codex،
وخوادم MCP الخاصة بالمستخدم، وتنفيذ Plugins المدعومة بالتطبيقات لتلك الدورة بدلا من
اعتبار صندوق العزل على جانب مضيف Codex مكافئا لخلفية صندوق عزل OpenClaw.
يُكشف الوصول إلى الصدفة عبر أدوات OpenClaw الديناميكية المدعومة بصندوق العزل
مثل `sandbox_exec` و`sandbox_process` عندما تكون أدوات exec/process العادية
متاحة.

على مضيفي Ubuntu/AppArmor، يمكن أن يفشل Codex bwrap تحت `workspace-write` قبل
بدء أمر الصدفة عندما تشغّل عمدا `workspace-write` الأصلي في Codex
دون صندوق عزل OpenClaw نشط. إذا رأيت
`bwrap: setting up uid map: Permission denied` أو
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`، فشغّل
`openclaw doctor` وأصلح سياسة مساحة أسماء المضيف المبلّغ عنها لمستخدم خدمة OpenClaw
بدلا من منح امتيازات أوسع لحاوية Docker. فضّل
ملف AppArmor محدود النطاق لعملية الخدمة؛ فخيار الرجوع
`kernel.apparmor_restrict_unprivileged_userns=0` يؤثر على المضيف كله وله
مفاضلات أمنية.

## التنفيذ الأصلي داخل صندوق العزل

الافتراضي المستقر هو الإغلاق عند الفشل: يعطّل صندوق عزل OpenClaw النشط
أسطح تنفيذ Codex الأصلية التي كانت ستعمل بخلاف ذلك من مضيف خادم تطبيق Codex.
استخدم `appServer.experimental.sandboxExecServer: true` فقط عندما تريد
تجربة دعم البيئة البعيدة في Codex مع خلفية صندوق عزل OpenClaw. يتطلب
مسار المعاينة هذا خادم تطبيق Codex 0.132.0 أو أحدث.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            experimental: {
              sandboxExecServer: true,
            },
          },
        },
      },
    },
  },
}
```

عندما تكون العلامة مفعلة وتكون جلسة OpenClaw الحالية داخل صندوق عزل، يبدأ OpenClaw
خادم exec-server عبر local loopback مدعوما بصندوق العزل النشط، ويسجله
مع خادم تطبيق Codex، ويبدأ سلسلة Codex ودورتها بتلك
البيئة المملوكة لـ OpenClaw. إذا تعذر على خادم التطبيق تسجيل البيئة،
تفشل عملية التشغيل مغلقة بدلا من الرجوع بصمت إلى التنفيذ على المضيف.

مسار المعاينة هذا محلي فقط. لا يستطيع خادم تطبيق WebSocket بعيد الوصول إلى
exec-server عبر loopback إلا إذا كان يعمل على المضيف نفسه، لذلك يرفض OpenClaw
هذا التركيب.

## المصادقة وعزل البيئة

تُختار المصادقة بهذا الترتيب:

1. ملف تعريف مصادقة OpenClaw Codex صريح للوكيل.
2. حساب خادم التطبيق الحالي في منزل Codex لذلك الوكيل.
3. لعمليات تشغيل خادم التطبيق المحلية عبر stdio فقط، `CODEX_API_KEY`، ثم
   `OPENAI_API_KEY`، عندما لا يكون حساب خادم التطبيق موجودا وما تزال مصادقة OpenAI
   مطلوبة.

عندما يرى OpenClaw ملف تعريف مصادقة Codex بنمط اشتراك ChatGPT، فإنه يزيل
`CODEX_API_KEY` و`OPENAI_API_KEY` من عملية Codex الفرعية المنشأة. يحافظ ذلك
على توفر مفاتيح API على مستوى Gateway للتضمينات أو نماذج OpenAI المباشرة
دون أن تتم فوترة دورات خادم تطبيق Codex الأصلية عبر API عن طريق الخطأ.

تستخدم ملفات تعريف Codex الصريحة بمفتاح API وخيار الرجوع إلى مفتاح env المحلي عبر stdio
تسجيل دخول خادم التطبيق بدلا من env الموروث من العملية الفرعية. لا تتلقى اتصالات
خادم تطبيق WebSocket خيار رجوع مفتاح API من env الخاص بـ Gateway؛ استخدم ملف تعريف مصادقة صريحا أو
حساب خادم التطبيق البعيد نفسه.

ترث عمليات تشغيل خادم التطبيق عبر stdio بيئة عملية OpenClaw افتراضيا.
يمتلك OpenClaw جسر حساب خادم تطبيق Codex ويضبط `CODEX_HOME` إلى
دليل لكل وكيل ضمن حالة OpenClaw لذلك الوكيل. يحافظ ذلك على نطاق تكوين Codex،
والحسابات، وذاكرة/بيانات Plugins المؤقتة، وحالة السلسلة ضمن وكيل OpenClaw
بدلا من تسربها من منزل `~/.codex` الشخصي للمشغل.

لا يعيد OpenClaw كتابة `HOME` لعمليات تشغيل خادم التطبيق المحلية العادية. ترى العمليات الفرعية
التي يشغّلها Codex مثل `openclaw`، و`gh`، و`git`، وواجهات CLI السحابية، وأوامر الصدفة
منزل العملية العادي ويمكنها العثور على تكوين ومفاتيح منزل المستخدم. قد يكتشف Codex أيضا
`$HOME/.agents/skills` و`$HOME/.agents/plugins/marketplace.json`؛
اكتشاف `.agents` هذا مشترك عمدا مع منزل المشغل وهو
منفصل عن حالة `~/.codex` المعزولة.

ما تزال Plugins الخاصة بـ OpenClaw ولقطات Skills الخاصة بـ OpenClaw تمر عبر
سجل Plugins ومحمل Skills الخاصين بـ OpenClaw. أما أصول Codex الشخصية في `~/.codex` فلا تمر كذلك. إذا
كانت لديك Skills أو Plugins مفيدة لـ Codex CLI من منزل Codex ينبغي أن تصبح
جزءا من وكيل OpenClaw، فاجردها صراحة:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

إذا كان النشر يحتاج إلى عزل بيئة إضافي، فأضف تلك المتغيرات إلى
`appServer.clearEnv`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

لا يؤثر `appServer.clearEnv` إلا على عملية خادم تطبيق Codex الفرعية المنشأة.
يزيل OpenClaw `CODEX_HOME` و`HOME` من هذه القائمة أثناء تسوية التشغيل المحلي:
يبقى `CODEX_HOME` لكل وكيل، ويبقى `HOME` موروثا لكي
تستطيع العمليات الفرعية استخدام حالة منزل المستخدم العادية.

## الأدوات الديناميكية

تستخدم أدوات Codex الديناميكية تحميل `searchable` افتراضيا. لا يكشف OpenClaw
الأدوات الديناميكية التي تكرر عمليات مساحة العمل الأصلية في Codex:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

تتوفر معظم أدوات تكامل OpenClaw المتبقية، مثل المراسلة، والوسائط، وCron،
والمتصفح، والعقد، وGateway، و`heartbeat_respond`، و`web_search`،
عبر بحث أدوات Codex ضمن مساحة الاسم `openclaw`. يحافظ ذلك على
سياق النموذج الأولي أصغر. تظل `sessions_yield` وردود المصدر الخاصة بأدوات الرسائل فقط
مباشرة لأنها عقود تحكم بالدورة. تبقى `sessions_spawn`
قابلة للبحث حتى يظل `spawn_agent` الأصلي في Codex سطح الوكيل الفرعي الأساسي في Codex،
بينما يظل تفويض OpenClaw أو ACP الصريح متاحا عبر
مساحة أسماء الأدوات الديناميكية `openclaw`.

اضبط `codexDynamicToolsLoading: "direct"` فقط عند الاتصال بخادم تطبيق Codex
مخصص لا يستطيع البحث في الأدوات الديناميكية المؤجلة أو عند تصحيح حمولة
الأدوات الكاملة.

## المهلات

تُقيّد استدعاءات الأدوات الديناميكية المملوكة لـ OpenClaw بشكل مستقل عن
`appServer.requestTimeoutMs`. يستخدم كل طلب Codex `item/tool/call` أول
مهلة متاحة بهذا الترتيب:

- وسيطة `timeoutMs` موجبة لكل استدعاء.
- بالنسبة إلى `image_generate`، `agents.defaults.imageGenerationModel.timeoutMs`.
- بالنسبة إلى `image_generate` دون مهلة مكوّنة، افتراضي توليد الصور البالغ 120 ثانية.
- بالنسبة إلى أداة فهم الوسائط `image`، يتم تحويل `tools.media.image.timeoutSeconds`
  إلى مللي ثانية، أو افتراضي الوسائط البالغ 60 ثانية. بالنسبة إلى فهم الصور،
  ينطبق هذا على الطلب نفسه ولا يُنقص بسبب أعمال التحضير السابقة.
- افتراضي الأداة الديناميكية البالغ 90 ثانية.

يمثل هذا المراقب ميزانية `item/tool/call` الديناميكية الخارجية. تعمل
مهلات الطلب الخاصة بالمزود داخل ذلك الاستدعاء وتحافظ على دلالات المهلة الخاصة بها.
تُحد ميزانيات الأدوات الديناميكية عند 600000 ms. عند انتهاء المهلة، يجهض OpenClaw
إشارة الأداة حيثما كان ذلك مدعوما ويعيد استجابة أداة ديناميكية فاشلة إلى Codex
حتى تتمكن الدورة من الاستمرار بدلا من ترك الجلسة في حالة `processing`.

بعد أن يقبل Codex دورة، وبعد أن يرد OpenClaw على طلب خادم تطبيق
مقيد بنطاق الدورة، يتوقع الحزام أن يحرز Codex تقدما في الدورة الحالية
وينهي في النهاية الدورة الأصلية مع `turn/completed`. إذا أصبح خادم التطبيق
صامتا لمدة `appServer.turnCompletionIdleTimeoutMs`، يحاول OpenClaw بأفضل جهد
مقاطعة دورة Codex، ويسجل مهلة تشخيصية، ويحرر
مسار جلسة OpenClaw حتى لا تصطف رسائل الدردشة اللاحقة خلف دورة أصلية
قديمة.

تقوم معظم الإشعارات غير النهائية للدورة نفسها بتعطيل ذلك الحارس القصير
لأن Codex أثبت أن الدورة ما زالت نشطة. تستخدم عمليات تسليم الأدوات ميزانية
خمول أطول بعد الأداة: بعد أن يعيد OpenClaw استجابة `item/tool/call`، وبعد
اكتمال عناصر الأدوات الأصلية مثل `commandExecution`، وبعد اكتمالات
`custom_tool_call_output` الخام، وبعد تقدم المساعد الخام بعد الأداة،
أو اكتمالات الاستدلال الخام، أو تقدم الاستدلال. يستخدم الحارس
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` عند ضبطه، وإلا
فيستخدم افتراضيا خمس دقائق. تمدد ميزانية ما بعد الأداة نفسها أيضا حارس
التقدم لنافذة التركيب الصامتة قبل أن يصدر Codex حدث الدورة الحالية التالي.
يمكن أن تتبع اكتمالات الاستدلال، واكتمالات `agentMessage` في commentary،
وتقدم الاستدلال الخام أو المساعد قبل الأداة برد نهائي تلقائي، لذلك تستخدم
حارس الرد بعد التقدم بدلا من تحرير مسار الجلسة فورا. وحدها عناصر
`agentMessage` النهائية/غير التعليقية المكتملة واكتمالات المساعد الخام قبل
الأداة تجهز تحرير مخرجات المساعد: إذا صمت Codex بعد ذلك من دون
`turn/completed`، يقاطع OpenClaw قدر الإمكان الدورة الأصلية ويحرر مسار
الجلسة. يعاد تشغيل إخفاقات خادم التطبيق عبر stdio الآمنة لإعادة التشغيل،
بما في ذلك مهلات خمول اكتمال الدورة من دون دليل على مساعد أو أداة أو عنصر
نشط أو أثر جانبي، مرة واحدة في محاولة جديدة لخادم التطبيق. أما المهلات غير
الآمنة فما زالت تسحب عميل خادم التطبيق العالق وتحرر مسار جلسة OpenClaw. وهي
تمحو أيضا ارتباط الخيط الأصلي القديم بدلا من إعادة تشغيلها تلقائيا. تعرض
مهلات مراقبة الإكمال نص مهلة خاصا بـ Codex: تقول الحالات الآمنة لإعادة
التشغيل إن الاستجابة قد تكون غير مكتملة، بينما تطلب الحالات غير الآمنة من
المستخدم التحقق من الحالة الحالية قبل إعادة المحاولة. تتضمن تشخيصات المهلة
العامة حقولا بنيوية مثل آخر طريقة إشعار من خادم التطبيق، ومعرف/نوع/دور عنصر
استجابة المساعد الخام، وأعداد الطلبات/العناصر النشطة، وحالة المراقبة
المجهزة. وعندما يكون آخر إشعار هو عنصر استجابة مساعد خام، فإنها تتضمن أيضا
معاينة محدودة لنص المساعد. ولا تتضمن محتوى المطالبة الخام أو الأداة.

## اكتشاف النماذج

افتراضيا، يطلب Plugin الخاص بـ Codex من خادم التطبيق النماذج المتاحة. يملك
خادم تطبيق Codex إتاحة النماذج، لذلك يمكن أن تتغير القائمة عندما يرقّي
OpenClaw إصدار `@openai/codex` المضمّن أو عندما يوجّه نشر ما
`appServer.command` إلى ملف Codex تنفيذي مختلف. وقد تكون الإتاحة أيضا محددة
بنطاق الحساب. استخدم `/codex models` على Gateway قيد التشغيل لرؤية الفهرس
الحي لذلك الحاضن والحساب.

إذا فشل الاكتشاف أو انتهت مهلته، يستخدم OpenClaw فهرسا احتياطيا مضمنا لـ:

- GPT-5.5
- GPT-5.4 mini

الحاضن المضمن الحالي هو `@openai/codex` `0.142.4`. أعاد مسبار `model/list`
على خادم التطبيق المضمن ذلك في مساحة عمل مفعّل فيها GPT-5.6 صفوف المنتقي
العامة التالية:

| معرف النموذج          | وسائط الإدخال | جهود الاستدلال                      |
| --------------------- | ------------- | ----------------------------------- |
| `gpt-5.6-sol`         | نص، صورة      | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra`       | نص، صورة      | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`        | نص، صورة      | low, medium, high, xhigh, max        |
| `gpt-5.5`             | نص، صورة      | low, medium, high, xhigh             |
| `gpt-5.4`             | نص، صورة      | low, medium, high, xhigh             |
| `gpt-5.4-mini`        | نص، صورة      | low, medium, high, xhigh             |
| `gpt-5.4-pro`         | نص، صورة      | medium, high, xhigh                  |
| `gpt-5.3-codex-spark` | نص            | low, medium, high, xhigh             |

الوصول إلى GPT-5.6 محدد بنطاق الحساب أثناء المعاينة المحدودة. `max` هو جهد
استدلال للنموذج. `ultra` هو بيانات وصفية منفصلة لتنسيق Codex متعدد الوكلاء،
وليس جهد استدلال قياسيا في OpenAI.

يمكن أن يعيد فهرس خادم التطبيق نماذج مخفية للتدفقات الداخلية أو المتخصصة،
لكنها ليست خيارات منتقي نماذج عادية.

اضبط الاكتشاف ضمن `plugins.entries.codex.config.discovery`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

عطّل الاكتشاف عندما تريد أن يتجنب بدء التشغيل فحص Codex وأن يستخدم فهرس
الاحتياط فقط:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## ملفات تمهيد مساحة العمل

يتعامل Codex مع `AGENTS.md` بنفسه من خلال اكتشاف مستندات المشروع الأصلية.
لا يكتب OpenClaw ملفات مستندات مشروع Codex اصطناعية ولا يعتمد على أسماء
الملفات الاحتياطية في Codex لملفات الشخصية، لأن احتياطات Codex لا تنطبق إلا
عند غياب `AGENTS.md`.

لتحقيق تكافؤ مساحة عمل OpenClaw، يحل حاضن Codex ملفات التمهيد الأخرى.
تمرر `SOUL.md` و`IDENTITY.md` و`TOOLS.md` و`USER.md` كتعليمات مطور
OpenClaw Codex لأنها تعرّف الوكيل النشط، وإرشادات مساحة العمل المتاحة،
وملف المستخدم. تمرر قائمة Skills المختصرة في OpenClaw كتعليمات مطور تعاون
محددة بنطاق الدورة. لا يحقن محتوى `HEARTBEAT.md`؛ تحصل دورات Heartbeat على
مؤشر وضع تعاون لقراءة الملف عندما يكون موجودا وغير فارغ. لا يلصق محتوى
`MEMORY.md` من مساحة عمل الوكيل المضبوطة في إدخال دورة Codex الأصلي عندما
تكون أدوات الذاكرة متاحة لتلك المساحة؛ وعندما يكون موجودا، يضيف الحاضن
مؤشرا صغيرا لذاكرة مساحة العمل إلى تعليمات مطور التعاون المحددة بنطاق
الدورة، وينبغي أن يستخدم Codex `memory_search` أو `memory_get` عندما تكون
الذاكرة الدائمة ذات صلة. إذا كانت الأدوات معطلة، أو كان بحث الذاكرة غير
متاح، أو اختلفت مساحة العمل النشطة عن مساحة عمل ذاكرة الوكيل، يستخدم
`MEMORY.md` مسار سياق الدورة المحدود المعتاد.
يمرر `BOOTSTRAP.md` عند وجوده كسياق مرجعي لإدخال دورة OpenClaw.

## تجاوزات البيئة

تظل تجاوزات البيئة متاحة للاختبار المحلي:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

يتجاوز `OPENCLAW_CODEX_APP_SERVER_BIN` الملف التنفيذي المدار عندما لا يكون
`appServer.command` مضبوطا.

أزيل `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`. استخدم
`plugins.entries.codex.config.appServer.mode: "guardian"` بدلا منه، أو
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` للاختبار المحلي لمرة واحدة. يفضّل
استخدام الإعدادات لعمليات النشر القابلة للتكرار لأنها تبقي سلوك Plugin في
الملف المراجع نفسه مثل بقية إعداد حاضن Codex.

## ذات صلة

- [حاضن Codex](/ar/plugins/codex-harness)
- [وقت تشغيل حاضن Codex](/ar/plugins/codex-harness-runtime)
- [Plugins Codex الأصلية](/ar/plugins/codex-native-plugins)
- [استخدام Codex للكمبيوتر](/ar/plugins/codex-computer-use)
- [مزود OpenAI](/ar/providers/openai)
- [مرجع الإعدادات](/ar/gateway/configuration-reference)
