---
read_when:
    - تحتاج إلى كل حقل تكوين في موجّه Codex
    - أنت تغيّر سلوك نقل خادم التطبيق أو المصادقَة أو الاكتشاف أو انتهاء المهلة
    - أنت تصحح أخطاء بدء تشغيل حزمة Codex، أو اكتشاف النماذج، أو عزل البيئة.
summary: مرجع التهيئة والمصادقة والاكتشاف وخادم التطبيق لإطار Codex
title: مرجع أداة تشغيل Codex
x-i18n:
    generated_at: "2026-06-27T18:02:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 32da817c262a61769b78b16c10e508175c730a568c2ba6321595c430815526a5
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

يغطي هذا المرجع الإعدادات التفصيلية لـ Plugin `codex` المضمّن. لقرارات الإعداد والتوجيه، ابدأ بـ
[مشغّل Codex](/ar/plugins/codex-harness).

## سطح إعدادات Plugin

توجد جميع إعدادات مشغّل Codex ضمن `plugins.entries.codex.config`.

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
| `discovery`                | مفعّل                  | إعدادات اكتشاف النماذج لـ `model/list` في خادم تطبيق Codex.                                                                               |
| `appServer`                | خادم تطبيق stdio مُدار | إعدادات النقل والأمر والمصادقة والموافقة وبيئة العزل والمهلة.                                                                        |
| `codexDynamicToolsLoading` | `"searchable"`           | استخدم `"direct"` لوضع أدوات OpenClaw الديناميكية مباشرة في سياق أدوات Codex الأولي.                                                  |
| `codexDynamicToolsExclude` | `[]`                     | أسماء إضافية لأدوات OpenClaw الديناميكية المطلوب حذفها من دورات خادم تطبيق Codex.                                                               |
| `codexPlugins`             | معطّل                 | دعم Plugin/التطبيق الأصلي في Codex للـ Plugins المنسّقة المثبّتة من المصدر والمُرحّلة. راجع [Plugins Codex الأصلية](/ar/plugins/codex-native-plugins). |
| `computerUse`              | معطّل                 | إعداد Codex Computer Use. راجع [Codex Computer Use](/ar/plugins/codex-computer-use).                                                          |

## نقل خادم التطبيق

افتراضيًا، يبدأ OpenClaw تشغيل ملف Codex التنفيذي المُدار والمشحون مع Plugin
المضمّن:

```bash
codex app-server --listen stdio://
```

يبقي هذا إصدار خادم التطبيق مرتبطًا بـ Plugin `codex` المضمّن بدلًا من
أي Codex CLI منفصل قد يكون مثبّتًا محليًا. اضبط
`appServer.command` فقط عندما تريد عمدًا تشغيل ملف تنفيذي مختلف.

بالنسبة إلى خادم تطبيق قيد التشغيل مسبقًا، استخدم نقل WebSocket:

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
| `command`                                     | ثنائي Codex مُدار                                   | الملف التنفيذي لنقل stdio. اتركه غير معيّن لاستخدام الثنائي المُدار.                                                                                                                                                                                                                                                                                                                          |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | وسيطات نقل stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | غير معيّن                                                  | عنوان URL لـ WebSocket app-server.                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | غير معيّن                                                  | رمز Bearer لنقل WebSocket. يقبل سلسلة حرفية أو SecretInput مثل `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | ترويسات WebSocket إضافية. تقبل قيم الترويسات سلاسل حرفية أو قيم SecretInput، مثل `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | أسماء متغيرات بيئة إضافية تُزال من عملية stdio app-server المُشغّلة بعد أن يبني OpenClaw بيئته الموروثة.                                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | غير معيّن                                                  | جذر مساحة عمل Codex app-server البعيد. عند تعيينه، يستنتج OpenClaw جذر مساحة العمل المحلية من مساحة عمل OpenClaw المحلولة، ويحافظ على لاحقة cwd الحالية تحت هذا الجذر البعيد، ويرسل cwd النهائي لـ app-server فقط إلى Codex. إذا كان cwd خارج جذر مساحة عمل OpenClaw المحلول، يفشل OpenClaw بإغلاق محكم بدلاً من إرسال مسار محلي للـ gateway إلى app-server البعيد. |
| `requestTimeoutMs`                            | `60000`                                                | المهلة الزمنية لاستدعاءات مستوى التحكم في app-server.                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | نافذة الهدوء بعد أن يقبل Codex دورة أو بعد طلب app-server ضمن نطاق الدورة بينما ينتظر OpenClaw `turn/completed`.                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | حارس خمول الإكمال والتقدم المستخدم بعد تسليم أداة، أو اكتمال أداة أصلية، أو تقدم المساعد الخام بعد الأداة، أو اكتمال التفكير الخام، أو تقدم التفكير بينما ينتظر OpenClaw `turn/completed`. استخدم هذا لأحمال العمل الموثوقة أو الثقيلة حيث يمكن لتوليف ما بعد الأداة أن يبقى هادئًا لمدة أطول بشكل مشروع من ميزانية إصدار المساعد النهائية.                                |
| `mode`                                        | `"yolo"` ما لم تمنع متطلبات Codex المحلية YOLO | إعداد مسبق للتنفيذ وفق YOLO أو التنفيذ المُراجع من guardian.                                                                                                                                                                                                                                                                                                                                                 |
| `approvalPolicy`                              | `"never"` أو سياسة موافقة guardian مسموح بها       | سياسة موافقة Codex الأصلية المُرسلة إلى بدء السلسلة والاستئناف والدورة.                                                                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` أو sandbox guardian مسموح به  | وضع sandbox الأصلي في Codex المُرسل إلى بدء السلسلة والاستئناف. تعمل sandboxes النشطة في OpenClaw على تضييق دورات `danger-full-access` إلى Codex `workspace-write`؛ وتتبع راية شبكة الدورة خروج OpenClaw sandbox.                                                                                                                                                                                       |
| `approvalsReviewer`                           | `"user"` أو مراجع guardian مسموح به               | استخدم `"auto_review"` للسماح لـ Codex بمراجعة مطالبات الموافقة الأصلية عندما يكون ذلك مسموحًا.                                                                                                                                                                                                                                                                                                                   |
| `defaultWorkspaceDir`                         | دليل العملية الحالية                              | مساحة العمل التي يستخدمها `/codex bind` عند حذف `--cwd`.                                                                                                                                                                                                                                                                                                                                        |
| `serviceTier`                                 | غير معيّن                                                  | طبقة خدمة Codex app-server اختيارية. يفعّل `"priority"` توجيه الوضع السريع، ويطلب `"flex"` معالجة flex، ويمسح `null` التجاوز. يُقبل `"fast"` القديم على أنه `"priority"`.                                                                                                                                                                                                 |
| `networkProxy`                                | معطّل                                               | الاشتراك في شبكة ملف تعريف أذونات Codex لأوامر app-server. يعرّف OpenClaw إعداد `permissions.<profile>.network` المحدد ويختاره باستخدام `default_permissions` بدلاً من إرسال `sandbox`.                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | اشتراك معاينة يسجّل بيئة Codex مدعومة بـ OpenClaw sandbox مع Codex app-server 0.132.0 أو أحدث حتى يتمكن تنفيذ Codex الأصلي من العمل داخل OpenClaw sandbox النشط.                                                                                                                                                                                                         |

`appServer.networkProxy` صريح لأنه يغيّر عقد Codex sandbox.
عند تفعيله، يعيّن OpenClaw أيضًا `features.network_proxy.enabled` و
`default_permissions` في إعداد سلسلة Codex حتى يتمكن ملف تعريف الأذونات
المولّد من بدء شبكة Codex المُدارة. افتراضيًا، يولّد OpenClaw اسم ملف تعريف
مقاومًا للتصادم `openclaw-network-<fingerprint>` من متن ملف التعريف؛ استخدم
`profileName` فقط عندما يكون اسم محلي ثابت مطلوبًا.

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

إذا كان تشغيل app-server العادي سيكون `danger-full-access`، فإن تفعيل
`networkProxy` يستخدم وصول نظام ملفات بنمط مساحة العمل لملف تعريف الأذونات
المولّد. إن فرض الشبكة المُدارة في Codex هو شبكة ضمن sandbox،
لذا فإن ملف تعريف الوصول الكامل لن يحمي حركة المرور الصادرة.

يحظر الـ plugin مصافحات app-server الأقدم أو غير ذات الإصدار. يجب على Codex app-server
أن يبلّغ عن إصدار مستقر `0.125.0` أو أحدث.

يتعامل OpenClaw مع عناوين URL لخادم تطبيقات WebSocket غير الخاصة بـ loopback على أنها بعيدة، ويتطلب
مصادقة WebSocket تحمل هوية عبر `appServer.authToken` أو ترويسة
`Authorization`. يمكن أن تكون قيمة `appServer.authToken` وكل قيمة `appServer.headers.*`
من نوع SecretInput؛ يحل وقت تشغيل الأسرار SecretRefs واختصار env
قبل أن يبني OpenClaw خيارات بدء خادم التطبيقات، وتفشل SecretRefs
المهيكلة غير المحلولة قبل إرسال أي رمز أو ترويسة. عند تكوين Plugins Codex
الأصلية، يستخدم OpenClaw مستوى تحكم Plugin في خادم التطبيقات المتصل
لتثبيت تلك Plugins أو تحديثها ثم يحدث مخزون التطبيقات حتى تكون التطبيقات المملوكة
للـ Plugin مرئية لسلسلة Codex. يظل `app/list` هو مصدر المخزون
والبيانات الوصفية الموثوق، لكن سياسة OpenClaw تقرر ما إذا كان
`thread/start` يرسل `config.apps[appId].enabled = true` لتطبيق قابل للوصول
ومدرج حتى إذا كان Codex يضع عليه حاليا علامة معطل. تبقى معرفات التطبيقات
المجهولة أو المفقودة مغلقة عند الفشل؛ لا ينشط هذا المسار إلا Plugins السوق عبر `plugin/install`
ويحدث المخزون. لا تصل OpenClaw إلا بخوادم تطبيقات بعيدة موثوقة بقبول
تثبيت Plugins المدار من OpenClaw وتحديثات مخزون التطبيقات.

## أوضاع الموافقة وصندوق الحماية

تستخدم جلسات خادم تطبيقات stdio المحلية وضع YOLO افتراضيا:
`approvalPolicy: "never"`، و`approvalsReviewer: "user"`، و
`sandbox: "danger-full-access"`. تتيح وضعية المشغل المحلي الموثوق هذه
لدورات OpenClaw غير المراقبة وHeartbeats إحراز تقدم دون مطالبات موافقة
أصلية لا يوجد أحد حولها للرد عليها.

إذا كان ملف متطلبات النظام المحلي في Codex يمنع قيم موافقة YOLO أو
المراجع أو صندوق الحماية الضمنية، يتعامل OpenClaw مع الافتراضي الضمني على أنه guardian
بدلا من ذلك ويختار أذونات guardian المسموح بها. كما يفرض
`tools.exec.mode: "auto"` موافقات Codex بمراجعة guardian ولا يحافظ على
تجاوزات `approvalPolicy: "never"` أو `sandbox: "danger-full-access"` القديمة
غير الآمنة؛ اضبط `tools.exec.mode: "full"` لوضع مقصود بلا موافقة.
تتم مراعاة إدخالات
`[[remote_sandbox_config]]` المطابقة لاسم المضيف في ملف المتطلبات نفسه
لاتخاذ قرار افتراضي صندوق الحماية.

اضبط `appServer.mode: "guardian"` لموافقات Codex بمراجعة guardian:

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
و`approvalsReviewer: "auto_review"`، و`sandbox: "workspace-write"` عندما تكون تلك
القيم مسموحة. تتجاوز حقول السياسة الفردية `mode`. ما زالت قيمة المراجع الأقدم
`guardian_subagent` مقبولة كاسم مستعار للتوافق، لكن يجب أن تستخدم الإعدادات الجديدة
`auto_review`.

عندما يكون صندوق حماية OpenClaw نشطا، تظل عملية خادم تطبيقات Codex المحلية
تعمل على مضيف Gateway. لذلك يعطل OpenClaw وضع Code Mode الأصلي في Codex،
وخوادم MCP الخاصة بالمستخدم، وتنفيذ Plugins المدعوم بالتطبيقات لتلك الدورة بدلا من
معاملة وضع صندوق الحماية من جهة مضيف Codex على أنه مكافئ لواجهة صندوق حماية
OpenClaw الخلفية. يتاح الوصول إلى Shell عبر أدوات OpenClaw الديناميكية المدعومة
بصندوق الحماية مثل `sandbox_exec` و`sandbox_process` عندما تكون أدوات exec/process
العادية متاحة.

على مضيفات Ubuntu/AppArmor، قد يفشل bwrap في Codex تحت `workspace-write` قبل
بدء أمر Shell عندما تشغل عمدا `workspace-write` الأصلي في Codex
دون تفعيل صندوق حماية OpenClaw. إذا رأيت
`bwrap: setting up uid map: Permission denied` أو
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`، فشغل
`openclaw doctor` وأصلح سياسة نطاقات المضيف المبلغة لمستخدم خدمة OpenClaw
بدلا من منح امتيازات أوسع لحاوية Docker. فضل ملف تعريف AppArmor محدد النطاق
لعملية الخدمة؛ فخيار الرجوع
`kernel.apparmor_restrict_unprivileged_userns=0` يطبق على المضيف كله وله
مقايضات أمنية.

## التنفيذ الأصلي داخل صندوق الحماية

الافتراضي المستقر هو الإغلاق عند الفشل: يعطل صندوق حماية OpenClaw النشط
أسطح تنفيذ Codex الأصلية التي كانت ستعمل من مضيف خادم تطبيقات Codex.
استخدم `appServer.experimental.sandboxExecServer: true` فقط عندما تريد
تجربة دعم البيئة البعيدة في Codex مع واجهة صندوق حماية OpenClaw الخلفية. يتطلب
مسار المعاينة هذا خادم تطبيقات Codex 0.132.0 أو أحدث.

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

عند تشغيل العلامة وتكون جلسة OpenClaw الحالية داخل صندوق الحماية، يبدأ OpenClaw
خادم تنفيذ local loopback مدعوما بصندوق الحماية النشط، ويسجله
مع خادم تطبيقات Codex، ويبدأ سلسلة Codex ودورتها بتلك
البيئة المملوكة لـ OpenClaw. إذا تعذر على خادم التطبيقات تسجيل البيئة،
يفشل التشغيل مغلقا بدلا من الرجوع بصمت إلى تنفيذ المضيف.

مسار المعاينة هذا محلي فقط. لا يستطيع خادم تطبيقات WebSocket بعيد الوصول إلى
خادم التنفيذ loopback إلا إذا كان يعمل على المضيف نفسه، لذلك يرفض OpenClaw
هذه التوليفة.

## عزل المصادقة والبيئة

تحدد المصادقة بهذا الترتيب:

1. ملف مصادقة OpenClaw Codex صريح للوكيل.
2. حساب خادم التطبيقات الموجود في موطن Codex لذلك الوكيل.
3. لإطلاقات خادم تطبيقات stdio المحلية فقط، `CODEX_API_KEY`، ثم
   `OPENAI_API_KEY`، عندما لا يكون هناك حساب خادم تطبيقات وما زالت مصادقة OpenAI
   مطلوبة.

عندما يرى OpenClaw ملف مصادقة Codex بأسلوب اشتراك ChatGPT، فإنه يزيل
`CODEX_API_KEY` و`OPENAI_API_KEY` من عملية Codex الفرعية المنشأة. يحافظ ذلك
على توفر مفاتيح API على مستوى Gateway للتضمينات أو نماذج OpenAI المباشرة
دون أن تجعل دورات خادم تطبيقات Codex الأصلية تفوتر عبر API بالخطأ.

تستخدم ملفات مفاتيح API الصريحة في Codex وخيار الرجوع المحلي لمفتاح env عبر stdio
تسجيل دخول خادم التطبيقات بدلا من env الموروث من العملية الفرعية. لا تتلقى
اتصالات خادم تطبيقات WebSocket خيار الرجوع إلى مفاتيح API من env الخاصة بـ Gateway؛ استخدم
ملف مصادقة صريحا أو حساب خادم التطبيقات البعيد نفسه.

ترث إطلاقات خادم تطبيقات stdio بيئة عملية OpenClaw افتراضيا.
يمتلك OpenClaw جسر حساب خادم تطبيقات Codex ويضبط `CODEX_HOME` إلى
دليل لكل وكيل ضمن حالة OpenClaw لذلك الوكيل. يحصر ذلك تكوين Codex،
والحسابات، وذاكرة/بيانات تخزين Plugin، وحالة السلسلة في وكيل OpenClaw
بدلا من تسربها من موطن `~/.codex` الشخصي للمشغل.

لا يعيد OpenClaw كتابة `HOME` لإطلاقات خادم التطبيقات المحلية العادية. ترى
العمليات الفرعية التي يشغلها Codex مثل `openclaw`، و`gh`، و`git`، وواجهات CLI السحابية،
وأوامر Shell موطن العملية العادي ويمكنها العثور على تكوين ورموز موطن المستخدم.
قد يكتشف Codex أيضا `$HOME/.agents/skills` و`$HOME/.agents/plugins/marketplace.json`؛
تتم مشاركة اكتشاف `.agents` هذا عمدا مع موطن المشغل وهو
منفصل عن حالة `~/.codex` المعزولة.

تظل Plugins OpenClaw ولقطات Skills الخاصة بـ OpenClaw تتدفق عبر
سجل Plugins ومحمل Skills الخاصين بـ OpenClaw. أما أصول Codex `~/.codex` الشخصية فلا تفعل.
إذا كانت لديك Skills أو Plugins مفيدة من Codex CLI من موطن Codex ويجب أن تصبح
جزءا من وكيل OpenClaw، فاحصرها صراحة:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

إذا احتاج نشر ما إلى عزل بيئي إضافي، فأضف تلك المتغيرات إلى
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

لا يؤثر `appServer.clearEnv` إلا في عملية خادم تطبيقات Codex الفرعية المنشأة.
يزيل OpenClaw `CODEX_HOME` و`HOME` من هذه القائمة أثناء تطبيع الإطلاق المحلي:
يبقى `CODEX_HOME` مخصصا لكل وكيل، ويبقى `HOME` موروثا حتى تتمكن
العمليات الفرعية من استخدام حالة موطن المستخدم العادية.

## الأدوات الديناميكية

تستخدم أدوات Codex الديناميكية تحميل `searchable` افتراضيا. لا يعرض OpenClaw
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
عبر بحث أدوات Codex ضمن مساحة الاسم `openclaw`. يحافظ هذا على سياق
النموذج الأولي أصغر. تظل `sessions_yield` وردود المصادر الخاصة بأدوات الرسائل فقط
مباشرة لأن تلك عقود تحكم بالدورة. تبقى `sessions_spawn`
قابلة للبحث حتى يظل `spawn_agent` الأصلي في Codex هو سطح الوكيل الفرعي الأساسي
في Codex، بينما يظل تفويض OpenClaw أو ACP الصريح متاحا عبر
مساحة أسماء أدوات `openclaw` الديناميكية.

اضبط `codexDynamicToolsLoading: "direct"` فقط عند الاتصال بخادم تطبيقات Codex مخصص
لا يستطيع البحث في الأدوات الديناميكية المؤجلة أو عند تصحيح حمولة الأدوات الكاملة.

## المهل الزمنية

تكون استدعاءات الأدوات الديناميكية المملوكة لـ OpenClaw محدودة بشكل مستقل عن
`appServer.requestTimeoutMs`. يستخدم كل طلب Codex `item/tool/call` أول
مهلة متاحة بهذا الترتيب:

- وسيطة `timeoutMs` موجبة لكل استدعاء.
- بالنسبة إلى `image_generate`، `agents.defaults.imageGenerationModel.timeoutMs`.
- بالنسبة إلى `image_generate` دون مهلة مكوّنة، افتراضي توليد الصور البالغ 120 ثانية.
- بالنسبة إلى أداة `image` لفهم الوسائط، `tools.media.image.timeoutSeconds`
  محولة إلى مللي ثانية، أو افتراضي الوسائط البالغ 60 ثانية. بالنسبة إلى فهم الصور،
  ينطبق هذا على الطلب نفسه ولا تخفضه أعمال التحضير السابقة.
- افتراضي الأداة الديناميكية البالغ 90 ثانية.

هذا المراقب هو ميزانية `item/tool/call` الديناميكية الخارجية. تعمل
مهل الطلب الخاصة بالمزود داخل ذلك الاستدعاء وتحافظ على دلالات المهلة الخاصة بها.
تحدد ميزانيات الأدوات الديناميكية بسقف 600000 ms. عند انتهاء المهلة، يوقف OpenClaw
إشارة الأداة حيث يكون ذلك مدعوما ويعيد استجابة أداة ديناميكية فاشلة إلى Codex
حتى تستمر الدورة بدلا من ترك الجلسة في حالة `processing`.

بعد أن يقبل Codex دورة، وبعد أن يرد OpenClaw على طلب خادم تطبيقات
ضمن نطاق الدورة، يتوقع الحزام أن يحقق Codex تقدما في الدورة الحالية
وأن ينهي في النهاية الدورة الأصلية بـ `turn/completed`. إذا أصبح خادم التطبيقات
صامتا لمدة `appServer.turnCompletionIdleTimeoutMs`، يحاول OpenClaw قدر الإمكان
مقاطعة دورة Codex، ويسجل مهلة تشخيصية، ويحرر مسار جلسة
OpenClaw حتى لا تصطف رسائل الدردشة اللاحقة خلف دورة أصلية راكدة.

تعطّل معظم الإشعارات غير النهائية للدور نفسه ذلك المراقب القصير
لأن Codex أثبت أن الدور ما زال حيًا. تستخدم عمليات تسليم الأدوات ميزانية خمول
أطول بعد الأداة: بعد أن يعيد OpenClaw استجابة `item/tool/call`، وبعد
اكتمال عناصر الأدوات الأصلية مثل `commandExecution`، وبعد اكتمالات
`custom_tool_call_output` الخام، وبعد تقدّم المساعد الخام بعد الأداة،
أو اكتمالات الاستدلال الخام، أو تقدّم الاستدلال. يستخدم الحارس
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` عند تكوينه،
ويعود افتراضيًا إلى خمس دقائق بخلاف ذلك. تمدد ميزانية ما بعد الأداة نفسها أيضًا
مراقب التقدم لنافذة التركيب الصامتة قبل أن يصدر Codex حدث الدور الحالي التالي.
يمكن أن تتبع اكتمالات الاستدلال، واكتمالات
`agentMessage` التعليقية، وتقدم الاستدلال الخام أو المساعد الخام قبل الأداة
برد نهائي تلقائي، لذلك تستخدم حارس الرد بعد التقدم بدلًا من تحرير مسار الجلسة فورًا.
فقط عناصر `agentMessage` المكتملة النهائية/غير التعليقية واكتمالات المساعد الخام
قبل الأداة تسلّح تحرير خرج المساعد: إذا صمت Codex بعد ذلك دون
`turn/completed`، يقاطع OpenClaw الدور الأصلي بأفضل جهد ويحرر
مسار الجلسة. تتم إعادة محاولة إخفاقات خادم التطبيق عبر stdio الآمنة لإعادة التشغيل،
بما في ذلك مهلات خمول اكتمال الدور من دون دليل على مساعد أو أداة أو عنصر نشط
أو أثر جانبي، مرة واحدة على محاولة خادم تطبيق جديدة. أما المهلات غير الآمنة
فما زالت تُحيل عميل خادم التطبيق العالق إلى التقاعد وتحرر مسار جلسة OpenClaw.
كما أنها تمسح ربط الخيط الأصلي القديم بدلًا من إعادة تشغيله تلقائيًا.
تعرض مهلات مراقبة الاكتمال نص مهلة خاصًا بـ Codex: تقول الحالات الآمنة لإعادة التشغيل
إن الاستجابة قد تكون غير مكتملة، بينما تطلب الحالات غير الآمنة من المستخدم
التحقق من الحالة الحالية قبل إعادة المحاولة. تتضمن تشخيصات المهلة العامة
حقولًا بنيوية مثل آخر طريقة إشعار من خادم التطبيق، ومعرّف/نوع/دور عنصر
استجابة المساعد الخام، وأعداد الطلبات/العناصر النشطة، وحالة المراقبة المسلحة.
وعندما يكون آخر إشعار عنصر استجابة مساعد خام، فإنها تتضمن أيضًا معاينة محدودة
لنص المساعد. ولا تتضمن محتوى المطالبة الخام أو الأداة.

## اكتشاف النماذج

افتراضيًا، يطلب Plugin الخاص بـ Codex من خادم التطبيق النماذج المتاحة. تعود
ملكية توفر النماذج إلى خادم تطبيق Codex، لذلك يمكن أن تتغير القائمة عندما يرقّي
OpenClaw إصدار `@openai/codex` المضمن أو عندما يوجّه نشرٌ ما
`appServer.command` إلى ملف تنفيذي مختلف لـ Codex. يمكن أن يكون التوفر
محدودًا بالحساب أيضًا. استخدم `/codex models` على Gateway قيد التشغيل لرؤية
الفهرس الحي لذلك الحاضن والحساب.

إذا فشل الاكتشاف أو انتهت مهلته، يستخدم OpenClaw فهرسًا احتياطيًا مضمنًا لـ:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

الحاضن المضمن الحالي هو `@openai/codex` `0.139.0`. أعاد فحص `model/list`
على خادم التطبيق المضمن ذلك ما يلي:

| معرّف النموذج   | افتراضي | مخفي | وسائط الإدخال | جهود الاستدلال           |
| --------------- | ------- | ---- | ------------- | ------------------------ |
| `gpt-5.5`       | نعم     | لا   | نص، صورة      | low, medium, high, xhigh |
| `gpt-5.4`       | لا      | لا   | نص، صورة      | low, medium, high, xhigh |
| `gpt-5.4-mini`  | لا      | لا   | نص، صورة      | low, medium, high, xhigh |
| `gpt-5.3-codex` | لا      | لا   | نص، صورة      | low, medium, high, xhigh |
| `gpt-5.2`       | لا      | لا   | نص، صورة      | low, medium, high, xhigh |

يمكن أن يعيد فهرس خادم التطبيق نماذج مخفية للتدفقات الداخلية أو
المتخصصة، لكنها ليست خيارات عادية في منتقي النماذج.

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

عطّل الاكتشاف عندما تريد أن يتجنب بدء التشغيل فحص Codex وأن يستخدم
الفهرس الاحتياطي فقط:

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

يتعامل Codex مع `AGENTS.md` بنفسه عبر اكتشاف مستندات المشروع الأصلي. لا يكتب
OpenClaw ملفات مستندات مشروع اصطناعية لـ Codex ولا يعتمد على أسماء ملفات
Codex الاحتياطية لملفات الشخصية، لأن احتياطيات Codex لا تنطبق إلا عندما يكون
`AGENTS.md` مفقودًا.

لتحقيق التكافؤ في مساحة عمل OpenClaw، يحل حاضن Codex ملفات التمهيد الأخرى.
يتم تمرير `SOUL.md` و`IDENTITY.md` و`TOOLS.md` و`USER.md` كتعليمات مطور
OpenClaw Codex لأنها تعرّف الوكيل النشط، وإرشادات مساحة العمل المتاحة،
وملف المستخدم. يتم تمرير قائمة Skills الموجزة في OpenClaw كتعليمات مطور
تعاونية محددة بنطاق الدور. لا يتم حقن محتوى `HEARTBEAT.md`؛ إذ تحصل أدوار
Heartbeat على مؤشر وضع تعاون لقراءة الملف عندما يكون موجودًا وغير فارغ.
لا يتم لصق محتوى `MEMORY.md` من مساحة عمل الوكيل المكوّنة في إدخال دور
Codex الأصلي عندما تكون أدوات الذاكرة متاحة لتلك المساحة؛ وعندما يكون موجودًا،
يضيف الحاضن مؤشرًا صغيرًا لذاكرة مساحة العمل إلى تعليمات مطور التعاون المحددة
بنطاق الدور، وينبغي لـ Codex استخدام `memory_search` أو `memory_get` عندما
تكون الذاكرة الدائمة ذات صلة. إذا كانت الأدوات معطلة، أو كان بحث الذاكرة غير
متاح، أو اختلفت مساحة العمل النشطة عن مساحة عمل ذاكرة الوكيل، يستخدم
`MEMORY.md` مسار سياق الدور المحدود المعتاد.
عند وجود `BOOTSTRAP.md`، يتم تمريره كسياق مرجعي لإدخال دور OpenClaw.

## تجاوزات البيئة

تبقى تجاوزات البيئة متاحة للاختبار المحلي:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

يتجاوز `OPENCLAW_CODEX_APP_SERVER_BIN` الملف التنفيذي المُدار عندما يكون
`appServer.command` غير معيّن.

تمت إزالة `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`. استخدم
`plugins.entries.codex.config.appServer.mode: "guardian"` بدلًا من ذلك، أو
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` لاختبار محلي لمرة واحدة. يُفضّل
التكوين لعمليات النشر القابلة للتكرار لأنه يبقي سلوك Plugin في الملف المراجع
نفسه مع بقية إعداد حاضن Codex.

## ذو صلة

- [حاضن Codex](/ar/plugins/codex-harness)
- [وقت تشغيل حاضن Codex](/ar/plugins/codex-harness-runtime)
- [Plugins Codex الأصلية](/ar/plugins/codex-native-plugins)
- [استخدام الكمبيوتر في Codex](/ar/plugins/codex-computer-use)
- [مزوّد OpenAI](/ar/providers/openai)
- [مرجع التكوين](/ar/gateway/configuration-reference)
