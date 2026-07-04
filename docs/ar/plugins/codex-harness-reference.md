---
read_when:
    - تحتاج إلى كل حقل إعدادات في عدة Codex
    - أنت تغيّر سلوك النقل أو المصادقة أو الاكتشاف أو انتهاء المهلة في خادم التطبيق
    - أنت تصحح أخطاء بدء تشغيل حزمة Codex، أو اكتشاف النماذج، أو عزل البيئة
summary: مرجع الإعدادات والمصادقة والاكتشاف وخادم التطبيق لحزمة Codex
title: مرجع حزمة Codex
x-i18n:
    generated_at: "2026-07-04T10:43:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 43c905586346c8d7c255b58b706eb82543fd1ca05588e459a257e8f9f4cf36d4
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

يغطي هذا المرجع الإعدادات التفصيلية لـ Plugin `codex`
المضمّن. لإعدادات الإعداد وقرارات التوجيه، ابدأ بـ
[حاضنة Codex](/ar/plugins/codex-harness).

## سطح إعدادات Plugin

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

الحقول المدعومة في المستوى الأعلى:

| الحقل                      | الافتراضي                  | المعنى                                                                                                                                   |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | مفعّل                  | إعدادات اكتشاف النماذج لـ Codex app-server `model/list`.                                                                               |
| `appServer`                | app-server مُدار عبر stdio | إعدادات النقل، والأمر، والمصادقة، والموافقة، وبيئة الحماية، والمهلة.                                                                        |
| `codexDynamicToolsLoading` | `"searchable"`           | استخدم `"direct"` لوضع أدوات OpenClaw الديناميكية مباشرة في سياق أدوات Codex الأولي.                                                  |
| `codexDynamicToolsExclude` | `[]`                     | أسماء إضافية لأدوات OpenClaw الديناميكية المطلوب حذفها من دورات Codex app-server.                                                               |
| `codexPlugins`             | معطّل                 | دعم Plugin/التطبيق الأصلي في Codex للـ Plugins المنتقاة والمثبتة من المصدر بعد ترحيلها. راجع [Plugins Codex الأصلية](/ar/plugins/codex-native-plugins). |
| `computerUse`              | معطّل                 | إعداد Codex Computer Use. راجع [Codex Computer Use](/ar/plugins/codex-computer-use).                                                          |

## نقل App-server

بشكل افتراضي، يبدأ OpenClaw تشغيل ملف Codex الثنائي المُدار المشحون مع Plugin
المضمّن:

```bash
codex app-server --listen stdio://
```

يحافظ هذا على ربط إصدار app-server بـ Plugin `codex` المضمّن بدلاً من
أي Codex CLI منفصل قد يكون مثبتاً محلياً. عيّن
`appServer.command` فقط عندما تريد عمداً تشغيل ملف تنفيذي مختلف.

بالنسبة إلى app-server قيد التشغيل مسبقاً، استخدم نقل WebSocket:

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
| `homeScope`                                   | `"agent"`                                              | يعزل `"agent"` حالة Codex لكل وكيل OpenClaw. يشارك `"user"` قيمة `$CODEX_HOME` الأصلية أو `~/.codex`، ويستخدم المصادقة الأصلية، ويمكّن إدارة السلاسل المحصورة بالمالك فقط. يتطلب نطاق المستخدم stdio.                                                                                                                                                                                               |
| `command`                                     | ملف Codex تنفيذي مُدار                                   | الملف التنفيذي لنقل stdio. اتركه غير مضبوط لاستخدام الملف التنفيذي المُدار.                                                                                                                                                                                                                                                                                                                          |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | وسائط نقل stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | غير مضبوط                                                  | عنوان URL لخادم تطبيق WebSocket.                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | غير مضبوط                                                  | رمز Bearer لنقل WebSocket. يقبل سلسلة حرفية أو SecretInput مثل `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | رؤوس WebSocket إضافية. تقبل قيم الرؤوس سلاسل حرفية أو قيم SecretInput، مثل `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | أسماء متغيرات بيئة إضافية تُزال من عملية خادم تطبيق stdio المُنشأة بعد أن يبني OpenClaw بيئته الموروثة.                                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | غير مضبوط                                                  | جذر مساحة عمل خادم تطبيق Codex البعيد. عند ضبطه، يستنتج OpenClaw جذر مساحة العمل المحلية من مساحة عمل OpenClaw المحلولة، ويحافظ على لاحقة cwd الحالية تحت هذا الجذر البعيد، ويرسل فقط cwd النهائي لخادم التطبيق إلى Codex. إذا كان cwd خارج جذر مساحة عمل OpenClaw المحلول، يفشل OpenClaw بشكل مغلق بدلا من إرسال مسار محلي للـ gateway إلى خادم التطبيق البعيد. |
| `requestTimeoutMs`                            | `60000`                                                | مهلة استدعاءات مستوى التحكم لخادم التطبيق.                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | نافذة الهدوء بعد قبول Codex لدورة أو بعد طلب خادم تطبيق محدود بنطاق الدورة بينما ينتظر OpenClaw `turn/completed`.                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | حارس خمول الإكمال والتقدم المستخدم بعد تسليم أداة، أو اكتمال أداة أصلية، أو تقدم مساعد خام بعد الأداة، أو اكتمال استدلال خام، أو تقدم استدلال بينما ينتظر OpenClaw `turn/completed`. استخدم هذا لأعباء العمل الموثوقة أو الثقيلة حيث يمكن لتوليف ما بعد الأداة أن يبقى هادئا بشكل مشروع لمدة أطول من ميزانية إصدار المساعد النهائي.                                |
| `mode`                                        | `"yolo"` ما لم تمنع متطلبات Codex المحلية YOLO | إعداد مسبق لتنفيذ YOLO أو التنفيذ المُراجع بواسطة guardian.                                                                                                                                                                                                                                                                                                                                                 |
| `approvalPolicy`                              | `"never"` أو سياسة موافقة guardian مسموح بها       | سياسة موافقة Codex الأصلية المرسلة إلى بدء السلسلة والاستئناف والدورة.                                                                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` أو صندوق رمل guardian مسموح به  | وضع صندوق رمل Codex الأصلي المرسل إلى بدء السلسلة والاستئناف. تضيق صناديق رمل OpenClaw النشطة دورات `danger-full-access` إلى `workspace-write` في Codex؛ وتتبع علامة شبكة الدورة خروج صندوق رمل OpenClaw.                                                                                                                                                                                       |
| `approvalsReviewer`                           | `"user"` أو مراجع guardian مسموح به               | استخدم `"auto_review"` للسماح لـ Codex بمراجعة مطالبات الموافقة الأصلية عندما يكون ذلك مسموحا.                                                                                                                                                                                                                                                                                                                   |
| `defaultWorkspaceDir`                         | دليل العملية الحالية                              | مساحة العمل التي يستخدمها `/codex bind` عند حذف `--cwd`.                                                                                                                                                                                                                                                                                                                                        |
| `serviceTier`                                 | غير مضبوط                                                  | طبقة خدمة اختيارية لخادم تطبيق Codex. يفعّل `"priority"` توجيه الوضع السريع، ويطلب `"flex"` معالجة flex، ويمسح `null` التجاوز. تُقبل القيمة القديمة `"fast"` بوصفها `"priority"`.                                                                                                                                                                                                 |
| `networkProxy`                                | معطل                                               | الاشتراك في شبكة ملف تعريف أذونات Codex لأوامر خادم التطبيق. يعرّف OpenClaw إعداد `permissions.<profile>.network` المحدد ويختاره باستخدام `default_permissions` بدلا من إرسال `sandbox`.                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | اشتراك معاينة يسجل بيئة Codex مدعومة بصندوق رمل OpenClaw مع خادم تطبيق Codex 0.132.0 أو أحدث، بحيث يمكن للتنفيذ الأصلي في Codex أن يعمل داخل صندوق رمل OpenClaw النشط.                                                                                                                                                                                                         |

يكون `appServer.networkProxy` صريحا لأنه يغير عقد صندوق رمل Codex.
عند تمكينه، يضبط OpenClaw أيضا `features.network_proxy.enabled` و
`default_permissions` في إعداد سلسلة Codex بحيث يمكن لملف تعريف الأذونات
المُنشأ بدء شبكة Codex المُدارة. بشكل افتراضي، ينشئ OpenClaw اسم ملف تعريف
مقاوما للتصادم `openclaw-network-<fingerprint>` من متن ملف التعريف؛ استخدم
`profileName` فقط عندما يكون اسم محلي ثابت مطلوبا.

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
`networkProxy` يستخدم وصول نظام الملفات بنمط مساحة العمل لملف
الأذونات المُنشأ. إن فرض الشبكة المُدار من Codex هو شبكة معزولة، لذلك فإن ملف
وصول كامل لن يحمي حركة المرور الصادرة.

يحظر Plugin المصافحات الأقدم أو غير المُرقّمة لخادم التطبيق. يجب أن يبلّغ خادم تطبيق Codex
عن الإصدار المستقر `0.125.0` أو أحدث.

يتعامل OpenClaw مع عناوين URL لخادم تطبيق WebSocket غير الخاصة بـ local loopback على أنها بعيدة ويتطلب
مصادقة WebSocket حاملة للهوية عبر `appServer.authToken` أو ترويسة
`Authorization`. يمكن أن تكون قيمة `appServer.authToken` وكل قيمة `appServer.headers.*`
من نوع SecretInput؛ يحل وقت تشغيل الأسرار SecretRefs واختصار env
قبل أن يبني OpenClaw خيارات بدء خادم التطبيق، وتفشل
SecretRefs المهيكلة غير المحلولة قبل إرسال أي رمز أو ترويسة. عند تكوين
Plugins Codex الأصلية، يستخدم OpenClaw مستوى التحكم في Plugin الخاص بخادم التطبيق المتصل
لتثبيت تلك Plugins أو تحديثها، ثم يحدّث مخزون التطبيقات بحيث
تكون التطبيقات المملوكة لـ Plugin مرئية لسلسلة Codex. يظل `app/list`
مصدر المخزون والبيانات الوصفية المعتمد، لكن سياسة OpenClaw تقرر ما إذا كان
`thread/start` سيرسل `config.apps[appId].enabled = true` لتطبيق مدرج ويمكن الوصول إليه
حتى إذا كان Codex يعلّمه حاليًا على أنه معطل. تظل معرّفات التطبيقات المجهولة أو المفقودة
مغلقة عند الفشل؛ لا يفعّل هذا المسار إلا Plugins السوق عبر `plugin/install`
ويحدّث المخزون. لا تصل OpenClaw إلا بخوادم تطبيق بعيدة موثوقة
لقبول تثبيت Plugins المُدارة من OpenClaw وتحديثات مخزون التطبيقات.

## أوضاع الموافقة والعزل

تستخدم جلسات خادم التطبيق المحلية عبر stdio وضع YOLO افتراضيًا:
`approvalPolicy: "never"` و`approvalsReviewer: "user"` و
`sandbox: "danger-full-access"`. يتيح وضع المشغّل المحلي الموثوق هذا
لأدوار OpenClaw غير المراقبة ونبضات Heartbeat التقدم دون مطالبات موافقة أصلية
لا يوجد أحد للرد عليها.

إذا كان ملف متطلبات النظام المحلي الخاص بـ Codex يمنع موافقة YOLO الضمنية
أو قيم المراجع أو العزل، يتعامل OpenClaw مع الافتراضي الضمني باعتباره guardian
بدلًا من ذلك ويختار أذونات guardian المسموحة. كما يفرض `tools.exec.mode: "auto"`
موافقات Codex خاضعة لمراجعة guardian ولا يحافظ على تجاوزات
`approvalPolicy: "never"` أو `sandbox: "danger-full-access"` القديمة غير الآمنة؛
اضبط `tools.exec.mode: "full"` لوضع مقصود بلا موافقة.
يتم احترام إدخالات
`[[remote_sandbox_config]]` المطابقة لاسم المضيف في ملف المتطلبات نفسه
لقرار افتراضي العزل.

اضبط `appServer.mode: "guardian"` لموافقات Codex الخاضعة لمراجعة guardian:

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

يتوسع الإعداد المسبق `guardian` إلى `approvalPolicy: "on-request"` و
`approvalsReviewer: "auto_review"` و`sandbox: "workspace-write"` عندما تكون هذه
القيم مسموحة. تتجاوز حقول السياسة الفردية `mode`. ما زالت قيمة المراجع الأقدم
`guardian_subagent` مقبولة كاسم مستعار للتوافق، لكن يجب أن تستخدم التكوينات الجديدة
`auto_review`.

عندما يكون عزل OpenClaw نشطًا، تظل عملية خادم تطبيق Codex المحلية
تعمل على مضيف Gateway. لذلك يعطّل OpenClaw وضع Code Mode الأصلي في Codex
وخوادم MCP الخاصة بالمستخدم وتنفيذ Plugin المدعوم بالتطبيقات لذلك الدور بدلًا من
اعتبار العزل من جهة مضيف Codex مكافئًا لخلفية عزل OpenClaw.
يُعرَض وصول الصدفة عبر أدوات OpenClaw الديناميكية المدعومة بالعزل
مثل `sandbox_exec` و`sandbox_process` عندما تكون أدوات exec/process العادية
متاحة.

على مضيفات Ubuntu/AppArmor، يمكن أن يفشل bwrap الخاص بـ Codex تحت
`workspace-write` قبل بدء أمر الصدفة عندما تشغّل عمدًا
`workspace-write` الأصلي في Codex دون عزل OpenClaw نشط. إذا رأيت
`bwrap: setting up uid map: Permission denied` أو
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`، شغّل
`openclaw doctor` وأصلح سياسة مساحة أسماء المضيف المُبلغ عنها لمستخدم خدمة OpenClaw
بدلًا من منح امتيازات أوسع لحاوية Docker. فضّل
ملف AppArmor محدود النطاق لعملية الخدمة؛ أما خيار الرجوع
`kernel.apparmor_restrict_unprivileged_userns=0` فهو على مستوى المضيف وله
مقايضات أمنية.

## التنفيذ الأصلي المعزول

الافتراضي المستقر هو الإغلاق عند الفشل: يعطّل عزل OpenClaw النشط
أسطح تنفيذ Codex الأصلية التي كانت ستعمل بخلاف ذلك من مضيف خادم تطبيق Codex.
استخدم `appServer.experimental.sandboxExecServer: true` فقط عندما تريد
تجربة دعم البيئة البعيدة في Codex مع خلفية عزل OpenClaw. يتطلب
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

عندما تكون الراية مفعلة وجلسة OpenClaw الحالية معزولة، يبدأ OpenClaw
خادم exec-server محليًا عبر local loopback مدعومًا بالعزل النشط، ويسجله
مع خادم تطبيق Codex، ويبدأ سلسلة Codex ودورها بتلك
البيئة المملوكة لـ OpenClaw. إذا تعذّر على خادم التطبيق تسجيل البيئة،
يفشل التشغيل بإغلاق بدلًا من الرجوع صامتًا إلى التنفيذ على المضيف.

مسار المعاينة هذا محلي فقط. لا يستطيع خادم تطبيق WebSocket بعيد الوصول إلى
exec-server عبر loopback إلا إذا كان يعمل على المضيف نفسه، لذلك يرفض OpenClaw
هذا الجمع.

## المصادقة وعزل البيئة

في المنزل الافتراضي لكل وكيل، تُختار المصادقة بهذا الترتيب:

1. ملف مصادقة OpenClaw Codex صريح للوكيل.
2. حساب خادم التطبيق الحالي في منزل Codex لذلك الوكيل.
3. لإطلاقات خادم التطبيق المحلية عبر stdio فقط، `CODEX_API_KEY`، ثم
   `OPENAI_API_KEY`، عندما لا يكون هناك حساب خادم تطبيق موجود وتظل مصادقة OpenAI
   مطلوبة.

عندما يرى OpenClaw ملف مصادقة Codex بنمط اشتراك ChatGPT، فإنه يزيل
`CODEX_API_KEY` و`OPENAI_API_KEY` من عملية Codex الفرعية المُنشأة. هذا
يبقي مفاتيح API على مستوى Gateway متاحة للتضمينات أو نماذج OpenAI المباشرة
دون جعل أدوار خادم تطبيق Codex الأصلية تُحاسب عبر API عن طريق الخطأ.

تستخدم ملفات مفاتيح API الصريحة لـ Codex والرجوع إلى مفتاح env المحلي عبر stdio
تسجيل دخول خادم التطبيق بدلًا من env الموروثة للعملية الفرعية. لا تتلقى اتصالات
خادم تطبيق WebSocket رجوع مفتاح API من env الخاصة بـ Gateway؛ استخدم ملف مصادقة صريحًا أو
حساب خادم التطبيق البعيد نفسه.

ترث إطلاقات خادم التطبيق عبر stdio بيئة عملية OpenClaw افتراضيًا.
يمتلك OpenClaw جسر حساب خادم تطبيق Codex ويضبط `CODEX_HOME` إلى
دليل لكل وكيل ضمن حالة OpenClaw لذلك الوكيل. يحافظ هذا على تكوين Codex
والحسابات وذاكرة التخزين المؤقت/بيانات Plugins وحالة السلاسل ضمن وكيل OpenClaw
بدلًا من التسرب من منزل `~/.codex` الشخصي للمشغّل.

اضبط `appServer.homeScope: "user"` لمشاركة حالة Codex الأصلية مع Codex
Desktop وCLI. يستخدم هذا الوضع المحلي عبر stdio فقط `$CODEX_HOME` عند ضبطه و
`~/.codex` بخلاف ذلك، بما في ذلك المصادقة والتكوين وPlugins والسلاسل الأصلية.
يتخطى OpenClaw جسر ملف المصادقة الخاص به لخادم التطبيق. يمكن لأدوار المالك
المتحقق منها استخدام `codex_threads` لسرد تلك السلاسل والبحث فيها وقراءتها
وتفريعها وإعادة تسميتها وأرشفتها واستعادتها. فرّع سلسلة قبل متابعتها في OpenClaw؛
لا تنسق عمليات Codex المستقلة الكتّاب المتزامنين للسلسلة نفسها.

لا يعيد OpenClaw كتابة `HOME` لإطلاقات خادم التطبيق المحلية العادية. ترى
العمليات الفرعية التي يشغّلها Codex مثل `openclaw` و`gh` و`git` وواجهات CLI السحابية
وأوامر الصدفة منزل العملية العادي ويمكنها العثور على تكوين ورموز منزل المستخدم.
قد يكتشف Codex أيضًا `$HOME/.agents/skills` و`$HOME/.agents/plugins/marketplace.json`؛
اكتشاف `.agents` هذا مشترك عمدًا مع منزل المشغّل وهو
منفصل عن حالة `~/.codex` المعزولة.

في نطاق الوكيل الافتراضي، تظل Plugins OpenClaw ولقطات Skills الخاصة بـ OpenClaw
تتدفق عبر سجل Plugins ومحمّل Skills الخاصين بـ OpenClaw؛ ولا تفعل أصول Codex
`~/.codex` الشخصية ذلك. إذا كانت لديك Skills أو Plugins مفيدة في Codex CLI من
منزل Codex ينبغي أن تصبح جزءًا من وكيل OpenClaw معزول، فاحصرها صراحة:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

إذا احتاج النشر إلى عزل بيئة إضافي، فأضف تلك المتغيرات إلى
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

لا يؤثر `appServer.clearEnv` إلا في عملية خادم تطبيق Codex الفرعية المُنشأة.
يزيل OpenClaw `CODEX_HOME` و`HOME` من هذه القائمة أثناء
تطبيع الإطلاق المحلي: يبقى `CODEX_HOME` موجّهًا إلى نطاق الوكيل أو المستخدم المحدد،
ويبقى `HOME` موروثًا بحيث تستطيع العمليات الفرعية استخدام حالة منزل المستخدم العادية.

## الأدوات الديناميكية

تستخدم أدوات Codex الديناميكية تحميل `searchable` افتراضيًا. لا يعرّض OpenClaw
أدوات ديناميكية تكرر عمليات مساحة العمل الأصلية في Codex:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

معظم أدوات تكامل OpenClaw المتبقية، مثل المراسلة والوسائط وCron
والمتصفح والعُقد وGateway و`heartbeat_respond` و`web_search`، متاحة
عبر بحث أدوات Codex تحت مساحة الاسم `openclaw`. هذا يبقي سياق النموذج الأولي
أصغر. تبقى `sessions_yield` وردود المصدر الخاصة بأدوات الرسائل فقط
مباشرة لأنها عقود تحكم بالدور. تبقى `sessions_spawn`
قابلة للبحث بحيث يظل `spawn_agent` الأصلي في Codex هو سطح الوكيل الفرعي الأساسي
في Codex، بينما يظل التفويض الصريح عبر OpenClaw أو ACP متاحًا عبر
مساحة اسم أدوات `openclaw` الديناميكية.

اضبط `codexDynamicToolsLoading: "direct"` فقط عند الاتصال بخادم تطبيق Codex مخصص
لا يستطيع البحث في الأدوات الديناميكية المؤجلة أو عند تصحيح حمولة
الأدوات الكاملة.

## المهلات

تُحد أدوات OpenClaw الديناميكية المملوكة له بشكل مستقل عن
`appServer.requestTimeoutMs`. يستخدم كل طلب Codex `item/tool/call` أول
مهلة متاحة بهذا الترتيب:

- وسيطة `timeoutMs` إيجابية لكل استدعاء.
- بالنسبة إلى `image_generate`، `agents.defaults.imageGenerationModel.timeoutMs`.
- بالنسبة إلى `image_generate` بدون مهلة مهيأة، افتراضي توليد الصور البالغ 120 ثانية.
- بالنسبة إلى أداة فهم الوسائط `image`، يتم تحويل `tools.media.image.timeoutSeconds`
  إلى مللي ثانية، أو افتراضي الوسائط البالغ 60 ثانية. بالنسبة إلى فهم الصور،
  ينطبق هذا على الطلب نفسه ولا يُخفض بسبب عمل التحضير السابق.
- افتراضي الأداة الديناميكية البالغ 90 ثانية.

هذا الحارس هو ميزانية `item/tool/call` الديناميكية الخارجية. تعمل
مهلات الطلب الخاصة بالمزوّدين داخل ذلك الاستدعاء وتحافظ على دلالات المهلة الخاصة بها.
تُحد ميزانيات الأدوات الديناميكية عند 600000 ms. عند انتهاء المهلة، يجهض OpenClaw
إشارة الأداة حيث يكون ذلك مدعومًا ويعيد استجابة أداة ديناميكية فاشلة إلى Codex
حتى يستطيع الدور المتابعة بدلًا من ترك الجلسة في `processing`.

بعد أن يقبل Codex دورًا، وبعد أن يرد OpenClaw على طلب خادم تطبيق
مقيد بالدور، يتوقع الحزام أن يحقق Codex تقدمًا في الدور الحالي
وأن ينهي في النهاية الدور الأصلي باستخدام `turn/completed`. إذا أصبح خادم التطبيق
صامتًا لمدة `appServer.turnCompletionIdleTimeoutMs`، يحاول OpenClaw بأفضل جهد
مقاطعة دور Codex، ويسجل مهلة تشخيصية، ويحرر
مسار جلسة OpenClaw بحيث لا تُصف رسائل الدردشة اللاحقة خلف دور
أصلي متوقف.

تعطّل معظم الإشعارات غير النهائية للدورة نفسها ذلك المراقب الزمني القصير
لأن Codex أثبت أن الدورة ما زالت نشطة. تستخدم تسليمات الأدوات ميزانية خمول
أطول بعد الأداة: بعد أن يعيد OpenClaw استجابة `item/tool/call`، وبعد اكتمال
عناصر الأدوات الأصلية مثل `commandExecution`، وبعد اكتمالات
`custom_tool_call_output` الخام، وبعد تقدم المساعد الخام بعد الأداة، أو اكتمالات
الاستدلال الخام، أو تقدم الاستدلال. يستخدم الحارس
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` عند تهيئته، وإلا
يفترض خمس دقائق. كما تمدد ميزانية ما بعد الأداة نفسها مراقب التقدم لنافذة
التركيب الصامتة قبل أن يصدر Codex حدث الدورة الحالية التالي. يمكن أن تتبع
اكتمالات الاستدلال، واكتمالات `agentMessage` في التعليق، وتقدم الاستدلال أو
المساعد الخام قبل الأداة برد نهائي تلقائي، لذلك تستخدم حارس الرد بعد التقدم
بدلا من تحرير مسار الجلسة فورا. وحدها عناصر `agentMessage` المكتملة النهائية/غير
التعليقية واكتمالات المساعد الخام قبل الأداة تفعّل تحرير إخراج المساعد: إذا
صمت Codex بعد ذلك دون `turn/completed`، يقاطع OpenClaw الدورة الأصلية بأفضل
جهد ويحرر مسار الجلسة. تتم إعادة محاولة إخفاقات خادم تطبيق stdio الآمنة لإعادة
التشغيل، بما في ذلك انتهاء مهلات خمول اكتمال الدورة دون دليل على مساعد أو أداة
أو عنصر نشط أو أثر جانبي، مرة واحدة في محاولة جديدة لخادم التطبيق. أما المهلات
غير الآمنة فما زالت تقاعد عميل خادم التطبيق العالق وتحرر مسار جلسة OpenClaw.
كما تمسح ربط الخيط الأصلي القديم بدلا من إعادة تشغيله تلقائيا. تعرض مهلات
مراقبة الاكتمال نص مهلة خاصا بـ Codex: الحالات الآمنة لإعادة التشغيل تقول إن
الاستجابة قد تكون غير مكتملة، بينما تطلب الحالات غير الآمنة من المستخدم التحقق
من الحالة الحالية قبل إعادة المحاولة. تتضمن تشخيصات المهلة العامة حقولا بنيوية
مثل آخر طريقة إشعار من خادم التطبيق، ومعرّف/نوع/دور عنصر استجابة المساعد الخام،
وأعداد الطلبات/العناصر النشطة، وحالة المراقبة المفعّلة. وعندما يكون آخر إشعار
عنصر استجابة مساعد خام، فإنها تتضمن أيضا معاينة محدودة لنص المساعد. ولا تتضمن
محتوى الموجّه أو الأداة الخام.

## اكتشاف النماذج

افتراضيا، يطلب Codex plugin من خادم التطبيق النماذج المتاحة. يملك خادم تطبيق
Codex إتاحة النماذج، لذلك قد تتغير القائمة عندما يرقّي OpenClaw إصدار
`@openai/codex` المضمّن أو عندما يشير نشر ما `appServer.command` إلى ملف Codex
تنفيذي مختلف. كما يمكن أن تكون الإتاحة مقيدة بالحساب. استخدم `/codex models`
على Gateway قيد التشغيل لرؤية الفهرس الحي لذلك الحزام والحساب.

إذا فشل الاكتشاف أو انتهت مهلته، يستخدم OpenClaw فهرس احتياط مضمّن لـ:

- GPT-5.5
- GPT-5.4 mini

الحزام المضمّن الحالي هو `@openai/codex` `0.142.4`. أعاد مسبار `model/list`
ضد خادم التطبيق المضمّن ذاك في مساحة عمل مفعّل فيها GPT-5.6 صفوف المنتقي
العامة هذه:

| معرّف النموذج         | وسائط الإدخال | جهود الاستدلال                    |
| --------------------- | ------------- | --------------------------------- |
| `gpt-5.6-sol`         | نص، صورة      | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra`       | نص، صورة      | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`        | نص، صورة      | low, medium, high, xhigh, max     |
| `gpt-5.5`             | نص، صورة      | low, medium, high, xhigh          |
| `gpt-5.4`             | نص، صورة      | low, medium, high, xhigh          |
| `gpt-5.4-mini`        | نص، صورة      | low, medium, high, xhigh          |
| `gpt-5.4-pro`         | نص، صورة      | medium, high, xhigh               |
| `gpt-5.3-codex-spark` | نص            | low, medium, high, xhigh          |

يكون الوصول إلى GPT-5.6 مقيدا بالحساب أثناء المعاينة المحدودة. `max` هو جهد
استدلال للنموذج. `ultra` بيانات وصفية منفصلة لتنسيق Codex متعدد الوكلاء، وليس
جهد استدلال قياسيا في OpenAI.

يمكن أن يعيد فهرس خادم التطبيق نماذج مخفية للتدفقات الداخلية أو المتخصصة، لكنها
ليست خيارات طبيعية في منتقي النماذج.

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

يتعامل Codex مع `AGENTS.md` بنفسه عبر اكتشاف مستندات المشروع الأصلي. لا يكتب
OpenClaw ملفات مستندات مشروع Codex اصطناعية ولا يعتمد على أسماء ملفات Codex
الاحتياطية لملفات الشخصية، لأن احتياطيات Codex لا تنطبق إلا عندما يكون
`AGENTS.md` مفقودا.

لتحقيق التكافؤ في مساحة عمل OpenClaw، يحل حزام Codex ملفات التمهيد الأخرى.
تُمرّر `SOUL.md` و`IDENTITY.md` و`TOOLS.md` و`USER.md` كتعليمات مطوّر OpenClaw
Codex لأنها تعرّف الوكيل النشط، وإرشادات مساحة العمل المتاحة، وملف المستخدم.
وتُمرّر قائمة OpenClaw Skills المختصرة كتعليمات مطوّر تعاون محددة بنطاق الدورة.
لا يُحقن محتوى `HEARTBEAT.md`؛ تتلقى دورات Heartbeat مؤشرا في وضع التعاون
لقراءة الملف عندما يكون موجودا وغير فارغ. لا يُلصق محتوى `MEMORY.md` من مساحة
عمل الوكيل المهيأة في إدخال دورة Codex الأصلي عندما تكون أدوات الذاكرة متاحة
لتلك المساحة؛ وعندما يكون موجودا، يضيف الحزام مؤشرا صغيرا لذاكرة مساحة العمل
إلى تعليمات مطوّر التعاون محددة بنطاق الدورة، وينبغي أن يستخدم Codex
`memory_search` أو `memory_get` عندما تكون الذاكرة الدائمة ذات صلة. إذا كانت
الأدوات معطلة، أو كان بحث الذاكرة غير متاح، أو كانت مساحة العمل النشطة مختلفة
عن مساحة عمل ذاكرة الوكيل، يستخدم `MEMORY.md` مسار سياق الدورة المحدود العادي.
عند وجود `BOOTSTRAP.md`، يُمرّر كسياق مرجعي لإدخال دورة OpenClaw.

## تجاوزات البيئة

تبقى تجاوزات البيئة متاحة للاختبار المحلي:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

يتجاوز `OPENCLAW_CODEX_APP_SERVER_BIN` الملف التنفيذي المُدار عندما لا يكون
`appServer.command` معيّنا.

أُزيل `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`. استخدم
`plugins.entries.codex.config.appServer.mode: "guardian"` بدلا منه، أو
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` للاختبار المحلي لمرة واحدة. تُفضّل
التهيئة للنشرات القابلة للتكرار لأنها تبقي سلوك Plugin في الملف نفسه الذي تمت
مراجعته مع بقية إعداد حزام Codex.

## ذات صلة

- [حزام Codex](/ar/plugins/codex-harness)
- [تشغيل حزام Codex](/ar/plugins/codex-harness-runtime)
- [Codex plugins أصلية](/ar/plugins/codex-native-plugins)
- [استخدام حاسوب Codex](/ar/plugins/codex-computer-use)
- [موفر OpenAI](/ar/providers/openai)
- [مرجع التهيئة](/ar/gateway/configuration-reference)
