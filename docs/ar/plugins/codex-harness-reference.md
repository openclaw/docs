---
read_when:
    - تحتاج إلى كل حقل تكوين في حاضنة Codex
    - أنت تغيّر سلوك النقل أو المصادقة أو الاكتشاف أو المهلة في app-server
    - أنت تصحح أخطاء بدء تشغيل حزمة Codex، أو اكتشاف النماذج، أو عزل البيئة
summary: مرجع التكوين والمصادقة والاكتشاف وخادم التطبيق لحزام Codex
title: مرجع إطار تشغيل Codex
x-i18n:
    generated_at: "2026-07-04T20:33:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1ffe2404dd35df36a706c098f99b841a9664baf76ee5d712836bb35d9ac78bc
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

يغطي هذا المرجع الإعدادات التفصيلية لـ Plugin `codex`
المضمّن. لقرارات الإعداد والتوجيه، ابدأ بـ
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
| `appServer`                | app-server مُدار عبر stdio | إعدادات النقل، والأمر، والمصادقة، والموافقة، وبيئة العزل، والمهلة.                                                                        |
| `codexDynamicToolsLoading` | `"searchable"`           | استخدم `"direct"` لوضع أدوات OpenClaw الديناميكية مباشرة في سياق أدوات Codex الأولي.                                                  |
| `codexDynamicToolsExclude` | `[]`                     | أسماء إضافية لأدوات OpenClaw الديناميكية المطلوب حذفها من دورات Codex app-server.                                                               |
| `codexPlugins`             | معطّل                 | دعم Plugin/app الأصلي في Codex للإضافات المنسّقة المثبّتة من المصدر بعد ترحيلها. راجع [إضافات Codex الأصلية](/ar/plugins/codex-native-plugins). |
| `computerUse`              | معطّل                 | إعداد Codex Computer Use. راجع [Codex Computer Use](/ar/plugins/codex-computer-use).                                                          |

## نقل app-server

افتراضيًا، يبدأ OpenClaw تشغيل ملف Codex الثنائي المُدار والمشحون مع
Plugin المضمّن:

```bash
codex app-server --listen stdio://
```

يبقي هذا إصدار app-server مرتبطًا بـ Plugin `codex` المضمّن بدلًا من
أي Codex CLI منفصل قد يكون مثبّتًا محليًا. عيّن
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
| `homeScope`                                   | `"agent"`                                              | يعزل `"agent"` حالة Codex لكل وكيل OpenClaw. يشارك `"user"` قيمة `$CODEX_HOME` الأصلية أو `~/.codex`، ويستخدم المصادقة الأصلية، ويفعّل إدارة الخيوط المقتصرة على المالك. يتطلب نطاق المستخدم stdio.                                                                                                                                                                                               |
| `command`                                     | ثنائية Codex المُدارة                                   | الملف التنفيذي لنقل stdio. اتركه غير مضبوط لاستخدام الثنائية المُدارة.                                                                                                                                                                                                                                                                                                                          |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | الوسائط لنقل stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | غير مضبوط                                                  | عنوان URL لـ app-server عبر WebSocket.                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | غير مضبوط                                                  | رمز Bearer لنقل WebSocket. يقبل سلسلة حرفية أو SecretInput مثل `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | ترويسات WebSocket إضافية. تقبل قيم الترويسات سلاسل حرفية أو قيم SecretInput، على سبيل المثال `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | أسماء متغيرات بيئة إضافية تُزال من عملية app-server عبر stdio التي تم تشغيلها بعد أن يبني OpenClaw بيئته الموروثة.                                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | غير مضبوط                                                  | جذر مساحة عمل Codex app-server البعيد. عند ضبطه، يستنتج OpenClaw جذر مساحة العمل المحلية من مساحة عمل OpenClaw المحلولة، ويحافظ على لاحقة cwd الحالية تحت هذا الجذر البعيد، ويرسل فقط cwd النهائي لـ app-server إلى Codex. إذا كان cwd خارج جذر مساحة عمل OpenClaw المحلول، يفشل OpenClaw بإغلاق آمن بدلاً من إرسال مسار محلي للـ Gateway إلى app-server البعيد. |
| `requestTimeoutMs`                            | `60000`                                                | مهلة استدعاءات مستوى التحكم لـ app-server.                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | نافذة الهدوء بعد قبول Codex لدورة أو بعد طلب app-server ضمن نطاق دورة بينما ينتظر OpenClaw `turn/completed`.                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | حارس خمول الإكمال والتقدم المستخدم بعد تسليم أداة، أو إكمال أداة أصلية، أو تقدم خام للمساعد بعد الأداة، أو إكمال تفكير خام، أو تقدم تفكير بينما ينتظر OpenClaw `turn/completed`. استخدم هذا للأحمال الموثوقة أو الثقيلة حيث يمكن لتوليف ما بعد الأداة أن يبقى هادئًا مدة أطول من ميزانية إصدار المساعد النهائي بشكل مشروع.                                |
| `mode`                                        | `"yolo"` ما لم تمنع متطلبات Codex المحلية YOLO | إعداد مسبق لتنفيذ YOLO أو تنفيذ يراجعه الحارس.                                                                                                                                                                                                                                                                                                                                                 |
| `approvalPolicy`                              | `"never"` أو سياسة موافقة حارس مسموح بها       | سياسة موافقة Codex الأصلية المرسلة إلى بدء الخيط، والاستئناف، والدورة.                                                                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` أو صندوق رمل حارس مسموح به  | وضع صندوق رمل Codex الأصلي المرسل إلى بدء الخيط واستئنافه. تضيق صناديق رمل OpenClaw النشطة دورات `danger-full-access` إلى Codex `workspace-write`؛ وتتبع راية شبكة الدورة خروج صندوق رمل OpenClaw.                                                                                                                                                                                       |
| `approvalsReviewer`                           | `"user"` أو مراجع حارس مسموح به               | استخدم `"auto_review"` للسماح لـ Codex بمراجعة مطالبات الموافقة الأصلية عندما يكون ذلك مسموحًا.                                                                                                                                                                                                                                                                                                                   |
| `defaultWorkspaceDir`                         | دليل العملية الحالية                              | مساحة العمل التي يستخدمها `/codex bind` عند حذف `--cwd`.                                                                                                                                                                                                                                                                                                                                        |
| `serviceTier`                                 | غير مضبوط                                                  | طبقة خدمة Codex app-server اختيارية. يفعّل `"priority"` توجيه الوضع السريع، ويطلب `"flex"` معالجة flex، ويمحو `null` التجاوز. يُقبل `"fast"` القديم على أنه `"priority"`.                                                                                                                                                                                                 |
| `networkProxy`                                | معطل                                               | الاشتراك في شبكات ملف تعريف أذونات Codex لأوامر app-server. يعرّف OpenClaw تهيئة `permissions.<profile>.network` المحددة ويختارها باستخدام `default_permissions` بدلاً من إرسال `sandbox`.                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | اشتراك معاينة يسجل بيئة Codex مدعومة بصندوق رمل OpenClaw لدى Codex app-server 0.132.0 أو أحدث، حتى يتمكن تنفيذ Codex الأصلي من العمل داخل صندوق رمل OpenClaw النشط.                                                                                                                                                                                                         |

يكون `appServer.networkProxy` صريحًا لأنه يغير عقد صندوق رمل Codex.
عند تفعيله، يضبط OpenClaw أيضًا `features.network_proxy.enabled` و
`default_permissions` في تهيئة خيط Codex حتى يتمكن ملف تعريف الأذونات المُولّد
من بدء شبكات Codex المُدارة. افتراضيًا، يولّد OpenClaw اسم ملف تعريف
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

إذا كان تشغيل خادم التطبيق العادي سيكون `danger-full-access`، فإن تمكين
`networkProxy` يستخدم وصولًا إلى نظام الملفات بنمط مساحة العمل لملف تعريف
الأذونات المُنشأ. إن فرض الشبكة المدار من Codex هو شبكات ضمن صندوق رمل،
لذلك لن يحمي ملف تعريف الوصول الكامل حركة المرور الصادرة.

يحظر Plugin المصافحات الأقدم أو غير ذات الإصدار من خادم التطبيق. يجب أن يبلّغ
خادم تطبيق Codex عن الإصدار المستقر `0.125.0` أو أحدث.

يتعامل OpenClaw مع عناوين URL لخادم تطبيق WebSocket غير المعتمدة على loopback
على أنها بعيدة، ويتطلب مصادقة WebSocket حاملة للهوية عبر `appServer.authToken`
أو ترويسة `Authorization`. يمكن أن يكون `appServer.authToken` وكل قيمة
`appServer.headers.*` من نوع SecretInput؛ يحل تشغيل الأسرار SecretRefs
واختصار env قبل أن يبني OpenClaw خيارات بدء خادم التطبيق، وتفشل SecretRefs
المهيكلة غير المحلولة قبل إرسال أي رمز أو ترويسة. عند تكوين Plugins الأصلية
لـ Codex، يستخدم OpenClaw مستوى تحكم Plugin في خادم التطبيق المتصل لتثبيت
تلك Plugins أو تحديثها، ثم يحدّث مخزون التطبيقات حتى تكون التطبيقات المملوكة
لـ Plugin مرئية لسلسلة Codex. يظل `app/list` مصدر المخزون والبيانات الوصفية
الموثوق، لكن سياسة OpenClaw تقرر ما إذا كان `thread/start` يرسل
`config.apps[appId].enabled = true` لتطبيق مدرج يمكن الوصول إليه حتى إذا كان
Codex يعلّمه حاليًا كمعطل. تظل معرفات التطبيقات غير المعروفة أو المفقودة
مغلقة عند الفشل؛ لا يفعّل هذا المسار إلا Plugins السوق عبر `plugin/install`
ويحدّث المخزون. لا تصل OpenClaw إلا بخوادم تطبيق بعيدة موثوقة لقبول تثبيتات
Plugins المُدارة من OpenClaw وتحديثات مخزون التطبيقات.

## أوضاع الموافقة وصندوق الرمل

تستخدم جلسات خادم التطبيق المحلية عبر stdio وضع YOLO افتراضيًا:
`approvalPolicy: "never"`، و`approvalsReviewer: "user"`، و
`sandbox: "danger-full-access"`. يتيح وضع المشغل المحلي الموثوق هذا لدورات
OpenClaw غير المراقبة وHeartbeats أن تتقدم دون مطالبات موافقة أصلية لا يوجد
أحد للإجابة عنها.

إذا كان ملف متطلبات النظام المحلي الخاص بـ Codex لا يسمح بقيم موافقة YOLO
أو المراجع أو صندوق الرمل الضمنية، يتعامل OpenClaw مع القيمة الافتراضية
الضمنية على أنها guardian بدلًا من ذلك ويختار أذونات guardian المسموح بها.
كما يفرض `tools.exec.mode: "auto"` موافقات Codex بمراجعة guardian ولا يحتفظ
بتجاوزات قديمة غير آمنة مثل `approvalPolicy: "never"` أو
`sandbox: "danger-full-access"`؛ اضبط `tools.exec.mode: "full"` لوضع مقصود
بلا موافقة. تُحترم إدخالات
`[[remote_sandbox_config]]` المطابقة لاسم المضيف في ملف المتطلبات نفسه
لاتخاذ قرار قيمة صندوق الرمل الافتراضية.

اضبط `appServer.mode: "guardian"` للموافقات التي يراجعها guardian في Codex:

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
و`approvalsReviewer: "auto_review"`، و`sandbox: "workspace-write"` عندما تكون
هذه القيم مسموحًا بها. تتجاوز حقول السياسة الفردية `mode`. ما زالت قيمة
المراجع الأقدم `guardian_subagent` مقبولة كاسم مستعار للتوافق، لكن يجب أن
تستخدم التكوينات الجديدة `auto_review`.

عندما يكون صندوق رمل OpenClaw نشطًا، تظل عملية خادم تطبيق Codex المحلية
تعمل على مضيف Gateway. لذلك يعطّل OpenClaw وضع الكود الأصلي في Codex، وخوادم
MCP الخاصة بالمستخدم، وتنفيذ Plugins المدعوم بالتطبيقات لتلك الدورة بدلًا من
اعتبار وضع صندوق الرمل من جهة مضيف Codex مكافئًا لخلفية صندوق رمل OpenClaw.
يُعرض وصول الصدفة عبر أدوات OpenClaw الديناميكية المدعومة بصندوق الرمل مثل
`sandbox_exec` و`sandbox_process` عندما تكون أدوات exec/process العادية
متاحة.

على مضيفات Ubuntu/AppArmor، يمكن أن يفشل bwrap الخاص بـ Codex تحت
`workspace-write` قبل بدء أمر الصدفة عندما تشغّل عمدًا `workspace-write`
الأصلي في Codex دون صندوق رمل OpenClaw نشط. إذا رأيت
`bwrap: setting up uid map: Permission denied` أو
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`، فشغّل
`openclaw doctor` وأصلح سياسة namespace للمضيف التي أُبلغ عنها لمستخدم خدمة
OpenClaw بدلًا من منح امتيازات أوسع لحاوية Docker. فضّل ملف تعريف AppArmor
محدد النطاق لعملية الخدمة؛ فالبديل
`kernel.apparmor_restrict_unprivileged_userns=0` يطبّق على مستوى المضيف كله
وله تبعات أمنية.

## التنفيذ الأصلي ضمن صندوق رمل

القيمة الافتراضية المستقرة هي الإغلاق عند الفشل: يعطّل صندوق رمل OpenClaw
النشط أسطح تنفيذ Codex الأصلية التي كانت ستعمل بخلاف ذلك من مضيف خادم تطبيق
Codex. استخدم `appServer.experimental.sandboxExecServer: true` فقط عندما تريد
تجربة دعم البيئة البعيدة في Codex مع خلفية صندوق رمل OpenClaw. يتطلب مسار
المعاينة هذا خادم تطبيق Codex بإصدار 0.132.0 أو أحدث.

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

عندما تكون العلامة مفعلة وتكون جلسة OpenClaw الحالية ضمن صندوق رمل، يبدأ
OpenClaw خادم exec-server عبر local loopback مدعومًا بصندوق الرمل النشط،
ويسجله لدى خادم تطبيق Codex، ثم يبدأ سلسلة Codex ودورتها بتلك البيئة
المملوكة لـ OpenClaw. إذا تعذر على خادم التطبيق تسجيل البيئة، يفشل التشغيل
مغلقًا بدلًا من الرجوع بصمت إلى تنفيذ المضيف.

مسار المعاينة هذا محلي فقط. لا يستطيع خادم تطبيق WebSocket بعيد الوصول إلى
exec-server على loopback إلا إذا كان يعمل على المضيف نفسه، لذلك يرفض OpenClaw
هذا الجمع.

## المصادقة وعزل البيئة

في الصفحة الرئيسية الافتراضية لكل وكيل، تُختار المصادقة بهذا الترتيب:

1. ملف تعريف مصادقة OpenClaw Codex صريح للوكيل.
2. الحساب الموجود لدى خادم التطبيق في Codex home لذلك الوكيل.
3. لتشغيلات خادم التطبيق المحلية عبر stdio فقط، `CODEX_API_KEY`، ثم
   `OPENAI_API_KEY`، عندما لا يكون أي حساب خادم تطبيق موجودًا وتظل مصادقة
   OpenAI مطلوبة.

عندما يرى OpenClaw ملف تعريف مصادقة Codex بنمط اشتراك ChatGPT، يزيل
`CODEX_API_KEY` و`OPENAI_API_KEY` من عملية Codex الفرعية المُنشأة. يحافظ ذلك
على توفر مفاتيح API على مستوى Gateway للتضمينات أو نماذج OpenAI المباشرة دون
أن تُحاسب دورات خادم تطبيق Codex الأصلية عبر API عن طريق الخطأ.

تستخدم ملفات تعريف مفاتيح API الصريحة لـ Codex والرجوع المحلي إلى مفاتيح env
عبر stdio تسجيل دخول خادم التطبيق بدلًا من env الموروث للعملية الفرعية. لا
تتلقى اتصالات خادم تطبيق WebSocket رجوعًا إلى مفتاح API من env الخاص بـ
Gateway؛ استخدم ملف تعريف مصادقة صريحًا أو حساب خادم التطبيق البعيد نفسه.

ترث تشغيلات خادم التطبيق عبر stdio بيئة عملية OpenClaw افتراضيًا. يملك
OpenClaw جسر حساب خادم تطبيق Codex ويضبط `CODEX_HOME` إلى دليل لكل وكيل تحت
حالة OpenClaw لذلك الوكيل. يبقي ذلك تكوين Codex، والحسابات، وذاكرة التخزين
المؤقت/بيانات Plugins، وحالة السلاسل محددة النطاق إلى وكيل OpenClaw بدلًا من
تسربها من الصفحة الرئيسية الشخصية للمشغل `~/.codex`.

اضبط `appServer.homeScope: "user"` لمشاركة حالة Codex الأصلية مع Codex
Desktop وCLI. يستخدم هذا الوضع المحلي عبر stdio فقط `$CODEX_HOME` عند ضبطه
و`~/.codex` بخلاف ذلك، بما في ذلك المصادقة الأصلية، والتكوين، وPlugins،
والسلاسل. يتخطى OpenClaw جسر ملف تعريف المصادقة الخاص به لخادم التطبيق.
يمكن لدورات المالك المتحقق منه استخدام `codex_threads` لسرد تلك السلاسل
والبحث فيها وقراءتها وتفريعها وإعادة تسميتها وأرشفتها واستعادتها. فرّع
السلسلة قبل متابعتها في OpenClaw؛ لا تنسق عمليات Codex المستقلة الكتّاب
المتزامنين للسلسلة نفسها.

لا يعيد OpenClaw كتابة `HOME` لتشغيلات خادم التطبيق المحلية العادية. ترى
العمليات الفرعية التي يشغّلها Codex مثل `openclaw` و`gh` و`git` وCLIs
السحابية وأوامر الصدفة الصفحة الرئيسية العادية للعملية ويمكنها العثور على
تكوين ورموز صفحة المستخدم الرئيسية. قد يكتشف Codex أيضًا
`$HOME/.agents/skills` و`$HOME/.agents/plugins/marketplace.json`؛ هذا اكتشاف
`.agents` مشترك عمدًا مع صفحة المشغل الرئيسية ومنفصل عن حالة `~/.codex`
المعزولة.

في نطاق الوكيل الافتراضي، تظل Plugins الخاصة بـ OpenClaw ولقطات Skills الخاصة
بـ OpenClaw تتدفق عبر سجل Plugins ومحمل Skills الخاصين بـ OpenClaw؛ أما أصول
Codex الشخصية في `~/.codex` فلا تفعل ذلك. إذا كانت لديك Skills أو Plugins
مفيدة لـ Codex CLI من Codex home ويجب أن تصبح جزءًا من وكيل OpenClaw معزول،
فاحصرها صراحة:

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

لا يؤثر `appServer.clearEnv` إلا في عملية خادم تطبيق Codex الفرعية المُنشأة.
يزيل OpenClaw `CODEX_HOME` و`HOME` من هذه القائمة أثناء تطبيع التشغيل المحلي:
يبقى `CODEX_HOME` مشيرًا إلى نطاق الوكيل أو المستخدم المحدد، ويبقى `HOME`
موروثًا حتى تتمكن العمليات الفرعية من استخدام حالة صفحة المستخدم الرئيسية
العادية.

## الأدوات الديناميكية

تستخدم أدوات Codex الديناميكية تحميل `searchable` افتراضيًا. لا يعرض OpenClaw
الأدوات الديناميكية التي تكرر عمليات مساحة العمل الأصلية في Codex:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

تتوفر معظم أدوات تكامل OpenClaw المتبقية، مثل المراسلة والوسائط وCron
والمتصفح والعُقد وGateway و`heartbeat_respond` و`web_search`، عبر بحث أدوات
Codex ضمن namespace `openclaw`. يحافظ هذا على سياق النموذج الأولي أصغر.
تبقى `sessions_yield` وردود المصدر الخاصة بأدوات الرسائل فقط مباشرة لأنها
عقود تحكم في الدورة. تبقى `sessions_spawn` قابلة للبحث حتى يظل
`spawn_agent` الأصلي في Codex هو سطح الوكيل الفرعي الأساسي في Codex، بينما
يظل التفويض الصريح عبر OpenClaw أو ACP متاحًا عبر namespace أدوات OpenClaw
الديناميكية.

اضبط `codexDynamicToolsLoading: "direct"` فقط عند الاتصال بخادم تطبيق Codex
مخصص لا يستطيع البحث في الأدوات الديناميكية المؤجلة أو عند تصحيح أخطاء حمولة
الأدوات الكاملة.

## المهل الزمنية

تكون استدعاءات الأدوات الديناميكية المملوكة لـ OpenClaw محددة بشكل مستقل عن
`appServer.requestTimeoutMs`. يستخدم كل طلب Codex من نوع `item/tool/call` أول
مهلة متاحة بهذا الترتيب:

- وسيطة `timeoutMs` موجبة لكل استدعاء.
- بالنسبة إلى `image_generate`، `agents.defaults.imageGenerationModel.timeoutMs`.
- بالنسبة إلى `image_generate` دون مهلة مهيأة، القيمة الافتراضية لتوليد الصور
  البالغة 120 ثانية.
- بالنسبة إلى أداة فهم الوسائط `image`، تُحوّل `tools.media.image.timeoutSeconds`
  إلى مللي ثانية، أو القيمة الافتراضية للوسائط البالغة 60 ثانية. بالنسبة إلى
  فهم الصور، ينطبق هذا على الطلب نفسه ولا يُخفض بسبب عمل التحضير السابق.
- القيمة الافتراضية للأداة الديناميكية البالغة 90 ثانية.

هذا الحارس الزمني هو ميزانية `item/tool/call` الديناميكية الخارجية. تعمل مهل
طلبات المزوّدين المحددة داخل ذلك الاستدعاء وتحافظ على دلالات المهلة الخاصة
بها. تُحدد ميزانيات الأدوات الديناميكية بحد أقصى 600000 ms. عند انتهاء
المهلة، يلغي OpenClaw إشارة الأداة حيثما كان ذلك مدعومًا ويرجع استجابة أداة
ديناميكية فاشلة إلى Codex حتى تتمكن الدورة من المتابعة بدلًا من ترك الجلسة
في حالة `processing`.

بعد أن يقبل Codex دورة، وبعد أن يستجيب OpenClaw لطلب خادم تطبيق محدد النطاق
للدورة، يتوقع الحامل أن يحرز Codex تقدمًا في الدورة الحالية وأن ينهي في
النهاية الدورة الأصلية بـ `turn/completed`. إذا صمت خادم التطبيق لمدة
`appServer.turnCompletionIdleTimeoutMs`، يحاول OpenClaw بأفضل جهد مقاطعة دورة
Codex، ويسجل مهلة تشخيصية، ويحرر مسار جلسة OpenClaw حتى لا تصطف رسائل
الدردشة اللاحقة خلف دورة أصلية قديمة.

تعطّل معظم الإشعارات غير النهائية للدورة نفسها ذلك المراقب القصير
لأن Codex أثبت أن الدورة لا تزال حية. تستخدم تسليمات الأدوات ميزانية خمول
أطول لما بعد الأداة: بعد أن يعيد OpenClaw استجابة `item/tool/call`، وبعد
اكتمال عناصر الأدوات الأصلية مثل `commandExecution`، وبعد اكتمالات
`custom_tool_call_output` الخام، وبعد تقدّم المساعد الخام بعد الأداة،
أو اكتمالات الاستدلال الخام، أو تقدّم الاستدلال. يستخدم الحارس
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` عند تكوينه
ويعود افتراضيًا إلى خمس دقائق بخلاف ذلك. تمد ميزانية ما بعد الأداة نفسها أيضًا
مراقب التقدّم لنافذة التركيب الصامتة قبل أن يصدر Codex حدث الدورة الحالية التالي.
يمكن أن تتبع اكتمالات الاستدلال، واكتمالات `agentMessage` في commentary،
وتقدّم الاستدلال الخام أو تقدّم المساعد قبل الأداة، استجابة نهائية تلقائية،
لذلك تستخدم حارس الرد بعد التقدّم بدلًا من تحرير ممر الجلسة فورًا. فقط عناصر
`agentMessage` المكتملة النهائية/غير commentary واكتمالات المساعد الخام قبل
الأداة تسلّح تحرير مخرجات المساعد: إذا صمت Codex بعد ذلك دون `turn/completed`،
يقاطع OpenClaw، بأفضل جهد، الدورة الأصلية ويحرر ممر الجلسة. يُعاد محاولة
إخفاقات خادم تطبيق stdio الآمنة لإعادة التشغيل، بما في ذلك مهل خمول اكتمال
الدورة دون دليل على مساعد أو أداة أو عنصر نشط أو أثر جانبي، مرة واحدة على
محاولة جديدة لخادم التطبيق. لا تزال المهل غير الآمنة تُقاعد عميل خادم التطبيق
العالق وتحرر ممر جلسة OpenClaw. كما تمسح ربط الخيط الأصلي القديم بدلًا من
إعادة تشغيله تلقائيًا. تعرض مهل مراقبة الاكتمال نص مهلة خاصًا بـ Codex:
تقول الحالات الآمنة لإعادة التشغيل إن الاستجابة قد تكون غير مكتملة، بينما تطلب
الحالات غير الآمنة من المستخدم التحقق من الحالة الحالية قبل إعادة المحاولة.
تتضمن تشخيصات المهلة العامة حقولًا بنيوية مثل آخر طريقة إشعار من خادم التطبيق،
ومعرّف/نوع/دور عنصر استجابة المساعد الخام، وأعداد الطلبات/العناصر النشطة،
وحالة المراقبة المسلحة. عندما يكون آخر إشعار عنصر استجابة مساعد خام، فإنها
تتضمن أيضًا معاينة محدودة لنص المساعد. ولا تتضمن نص الموجّه الخام أو محتوى
الأدوات.

## اكتشاف النماذج

افتراضيًا، يطلب Plugin Codex من خادم التطبيق النماذج المتاحة. يملك خادم تطبيق
Codex إتاحة النماذج، لذلك قد تتغير القائمة عندما يرقّي OpenClaw إصدار
`@openai/codex` المضمّن أو عندما يوجّه نشر ما `appServer.command` إلى ملف
Codex ثنائي مختلف. يمكن أن تكون الإتاحة مقيّدة بالحساب أيضًا. استخدم
`/codex models` على Gateway قيد التشغيل لرؤية الفهرس الحي لذلك الحزام
والحساب.

إذا فشل الاكتشاف أو انتهت مهلته، يستخدم OpenClaw فهرسًا احتياطيًا مضمّنًا لـ:

- GPT-5.5
- GPT-5.4 mini

الحزام المضمّن الحالي هو `@openai/codex` `0.142.5`. أعاد فحص `model/list`
ضد خادم التطبيق المضمّن صفوف المنتقي العامة هذه:

| معرّف النموذج         | أنماط الإدخال | جهود الاستدلال             |
| --------------------- | ------------- | -------------------------- |
| `gpt-5.5`             | نص، صورة      | منخفض، متوسط، عالٍ، xhigh |
| `gpt-5.4`             | نص، صورة      | منخفض، متوسط، عالٍ، xhigh |
| `gpt-5.4-mini`        | نص، صورة      | منخفض، متوسط، عالٍ، xhigh |
| `gpt-5.3-codex-spark` | نص            | منخفض، متوسط، عالٍ، xhigh |

يمكن أن يعيد فهرس خادم التطبيق نماذج مخفية للتدفقات الداخلية أو المتخصصة،
لكنها ليست خيارات عادية في منتقي النماذج.

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

عطّل الاكتشاف عندما تريد أن يتجنب بدء التشغيل فحص Codex ويستخدم الفهرس
الاحتياطي فقط:

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

يتعامل Codex مع `AGENTS.md` بنفسه عبر اكتشاف مستندات المشروع الأصلية.
لا يكتب OpenClaw ملفات مستندات مشروع Codex اصطناعية ولا يعتمد على أسماء
ملفات Codex الاحتياطية لملفات الشخصية، لأن بدائل Codex لا تنطبق إلا عند
غياب `AGENTS.md`.

لتحقيق تكافؤ مساحة عمل OpenClaw، يحل حزام Codex ملفات التمهيد الأخرى.
تُمرر `SOUL.md` و`IDENTITY.md` و`TOOLS.md` و`USER.md` كتعليمات مطور
OpenClaw Codex لأنها تعرّف العامل النشط، وإرشادات مساحة العمل المتاحة،
وملف المستخدم الشخصي. تُمرر قائمة Skills المختصرة في OpenClaw كتعليمات
مطور تعاون محددة بالدورة. لا يُحقن محتوى `HEARTBEAT.md`؛ تحصل دورات
Heartbeat على مؤشر وضع تعاون لقراءة الملف عند وجوده وكونه غير فارغ. لا يُلصق
محتوى `MEMORY.md` من مساحة عمل العامل المكوّنة في إدخال دورة Codex الأصلي
عندما تكون أدوات الذاكرة متاحة لتلك المساحة؛ وعند وجوده، يضيف الحزام مؤشر
ذاكرة مساحة عمل صغيرًا إلى تعليمات مطور التعاون المحددة بالدورة، وينبغي أن
يستخدم Codex `memory_search` أو `memory_get` عندما تكون الذاكرة الدائمة
ذات صلة. إذا كانت الأدوات معطلة، أو كان بحث الذاكرة غير متاح، أو كانت مساحة
العمل النشطة تختلف عن مساحة ذاكرة العامل، يستخدم `MEMORY.md` مسار سياق
الدورة المحدود العادي. عند وجود `BOOTSTRAP.md`، يُمرر كسياق مرجعي لإدخال
دورة OpenClaw.

## تجاوزات البيئة

تظل تجاوزات البيئة متاحة للاختبار المحلي:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

يتجاوز `OPENCLAW_CODEX_APP_SERVER_BIN` الملف الثنائي المُدار عندما لا يكون
`appServer.command` مضبوطًا.

أُزيل `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`. استخدم
`plugins.entries.codex.config.appServer.mode: "guardian"` بدلًا من ذلك، أو
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` للاختبار المحلي لمرة واحدة. يُفضَّل
التكوين لعمليات النشر القابلة للتكرار لأنه يبقي سلوك Plugin في الملف
المراجَع نفسه مع بقية إعداد حزام Codex.

## ذو صلة

- [حزام Codex](/ar/plugins/codex-harness)
- [تشغيل حزام Codex](/ar/plugins/codex-harness-runtime)
- [Plugins Codex الأصلية](/ar/plugins/codex-native-plugins)
- [استخدام Codex للحاسوب](/ar/plugins/codex-computer-use)
- [موفّر OpenAI](/ar/providers/openai)
- [مرجع التكوين](/ar/gateway/configuration-reference)
