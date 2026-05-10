---
read_when:
    - تحتاج إلى كل حقل من حقول إعدادات مشغّل Codex
    - أنت تغيّر سلوك النقل أو المصادقة أو الاكتشاف أو المهلة الزمنية في app-server
    - أنت تصحّح أخطاء بدء تشغيل حاضنة Codex، أو اكتشاف النماذج، أو عزل البيئة
summary: مرجع التهيئة والمصادقة والاكتشاف وخادم التطبيق لحاضنة Codex
title: مرجع بيئة تشغيل Codex
x-i18n:
    generated_at: "2026-05-10T19:48:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72767810c9448015a1ce7f35263dba576151b18c1f4a43ba531d45728241f095
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

يغطي هذا المرجع الإعدادات التفصيلية لـ Plugin `codex`
المضمّن. بالنسبة لقرارات الإعداد والتوجيه، ابدأ بـ
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

| الحقل                      | القيمة الافتراضية                  | المعنى                                                                                                                                   |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | مفعّل                  | إعدادات اكتشاف النماذج لـ `model/list` في خادم تطبيقات Codex.                                                                               |
| `appServer`                | خادم تطبيقات stdio مُدار | إعدادات النقل، والأمر، والمصادقة، والموافقة، والعزل، والمهلة.                                                                        |
| `codexDynamicToolsLoading` | `"searchable"`           | استخدم `"direct"` لوضع أدوات OpenClaw الديناميكية مباشرة في سياق أدوات Codex الأولي.                                                  |
| `codexDynamicToolsExclude` | `[]`                     | أسماء أدوات OpenClaw الديناميكية الإضافية المطلوب حذفها من أدوار خادم تطبيقات Codex.                                                               |
| `codexPlugins`             | معطّل                 | دعم Plugin/التطبيق الأصلي في Codex للـ plugins المنسقة والمثبتة من المصدر بعد الترحيل. راجع [Plugins الأصلية في Codex](/ar/plugins/codex-native-plugins). |
| `computerUse`              | معطّل                 | إعداد استخدام الكمبيوتر في Codex. راجع [استخدام الكمبيوتر في Codex](/ar/plugins/codex-computer-use).                                                          |

## نقل خادم التطبيقات

افتراضياً، يبدأ OpenClaw ملف Codex الثنائي المُدار المشحون مع Plugin
المضمّن:

```bash
codex app-server --listen stdio://
```

يبقي هذا إصدار خادم التطبيقات مرتبطاً بـ Plugin `codex` المضمّن بدلاً من
أي Codex CLI منفصل قد يكون مثبتاً محلياً. اضبط
`appServer.command` فقط عندما تريد عن قصد تشغيل ملف تنفيذي مختلف.

بالنسبة إلى خادم تطبيقات قيد التشغيل بالفعل، استخدم نقل WebSocket:

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

| الحقل                         | القيمة الافتراضية                                                | المعنى                                                                                                                                                                                         |
| ----------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | يؤدي `"stdio"` إلى تشغيل Codex؛ ويتصل `"websocket"` بـ `url`.                                                                                                                                        |
| `command`                     | ملف Codex الثنائي المُدار                                   | الملف التنفيذي لنقل stdio. اتركه غير مضبوط لاستخدام الملف الثنائي المُدار.                                                                                                                          |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | الوسيطات لنقل stdio.                                                                                                                                                                  |
| `url`                         | غير مضبوط                                                  | عنوان URL لخادم تطبيقات WebSocket.                                                                                                                                                                       |
| `authToken`                   | غير مضبوط                                                  | رمز Bearer لنقل WebSocket.                                                                                                                                                           |
| `headers`                     | `{}`                                                   | ترويسات WebSocket إضافية.                                                                                                                                                                        |
| `clearEnv`                    | `[]`                                                   | أسماء متغيرات بيئة إضافية تُزال من عملية خادم تطبيقات stdio التي جرى تشغيلها بعد أن يبني OpenClaw بيئته الموروثة.                                                             |
| `requestTimeoutMs`            | `60000`                                                | مهلة استدعاءات مستوى التحكم في خادم التطبيقات.                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | نافذة هادئة بعد طلب إلى خادم التطبيقات محدود النطاق بدور بينما ينتظر OpenClaw حدث `turn/completed`.                                                                                                  |
| `mode`                        | `"yolo"` ما لم تمنع متطلبات Codex المحلية YOLO | إعداد مسبق لتنفيذ YOLO أو التنفيذ الخاضع لمراجعة guardian.                                                                                                                                                 |
| `approvalPolicy`              | `"never"` أو سياسة موافقة guardian مسموح بها       | سياسة موافقة Codex الأصلية المرسلة إلى بدء الخيط واستئنافه والدور.                                                                                                                            |
| `sandbox`                     | `"danger-full-access"` أو عزل guardian مسموح به  | وضع عزل Codex الأصلي المرسل إلى بدء الخيط واستئنافه.                                                                                                                                      |
| `approvalsReviewer`           | `"user"` أو مراجع guardian مسموح به               | استخدم `"auto_review"` للسماح لـ Codex بمراجعة مطالبات الموافقة الأصلية عند السماح بذلك.                                                                                                                   |
| `defaultWorkspaceDir`         | دليل العملية الحالي                              | مساحة العمل التي يستخدمها `/codex bind` عند حذف `--cwd`.                                                                                                                                        |
| `serviceTier`                 | غير مضبوط                                                  | طبقة خدمة خادم تطبيقات Codex اختيارية. يمكّن `"priority"` توجيه الوضع السريع، ويطلب `"flex"` معالجة مرنة، ويمسح `null` التجاوز. تُقبل القيمة القديمة `"fast"` بوصفها `"priority"`. |

يحظر Plugin مصافحات خادم التطبيقات القديمة أو غير ذات الإصدار. يجب أن يعلن
خادم تطبيقات Codex عن الإصدار المستقر `0.125.0` أو أحدث.

## أوضاع الموافقة والعزل

تستخدم جلسات خادم تطبيقات stdio المحلية وضع YOLO افتراضياً:
`approvalPolicy: "never"`، و`approvalsReviewer: "user"`، و
`sandbox: "danger-full-access"`. يتيح وضع المشغّل المحلي الموثوق هذا
لأدوار OpenClaw غير المراقبة وHeartbeats التقدم من دون مطالبات موافقة
أصلية لا يوجد أحد متاح للرد عليها.

إذا كان ملف متطلبات النظام المحلي في Codex يمنع قيم موافقة YOLO أو المراجع
أو العزل الضمنية، فإن OpenClaw يعامل القيمة الافتراضية الضمنية باعتبارها
guardian بدلاً من ذلك ويحدد أذونات guardian المسموح بها. تُحترم إدخالات
`[[remote_sandbox_config]]` المطابقة لاسم المضيف في ملف المتطلبات نفسه
عند اتخاذ قرار القيمة الافتراضية للعزل.

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

يتوسع الإعداد المسبق `guardian` إلى `approvalPolicy: "on-request"`،
و`approvalsReviewer: "auto_review"`، و`sandbox: "workspace-write"` عندما تكون
تلك القيم مسموحاً بها. تتجاوز حقول السياسة الفردية `mode`. لا تزال قيمة
المراجع الأقدم `guardian_subagent` مقبولة كاسم مستعار للتوافق، لكن يجب أن
تستخدم الإعدادات الجديدة `auto_review`.

## المصادقة وعزل البيئة

تُحدد المصادقة بهذا الترتيب:

1. ملف تعريف مصادقة OpenClaw Codex صريح للوكيل.
2. الحساب الحالي لخادم التطبيقات في منزل Codex الخاص بذلك الوكيل.
3. بالنسبة إلى عمليات تشغيل خادم تطبيقات stdio المحلية فقط، `CODEX_API_KEY`، ثم
   `OPENAI_API_KEY`، عندما لا يكون هناك حساب خادم تطبيقات وكانت مصادقة OpenAI
   لا تزال مطلوبة.

عندما يرى OpenClaw ملف تعريف مصادقة Codex بنمط اشتراك ChatGPT، فإنه يزيل
`CODEX_API_KEY` و`OPENAI_API_KEY` من عملية Codex الفرعية التي جرى تشغيلها. يحافظ
ذلك على مفاتيح API على مستوى Gateway متاحة للتضمينات أو نماذج OpenAI المباشرة
من دون أن تُحسب أدوار خادم تطبيقات Codex الأصلية عبر API بالخطأ.

تستخدم ملفات تعريف مفاتيح API الصريحة في Codex والرجوع إلى مفاتيح البيئة في
stdio المحلي تسجيل دخول خادم التطبيقات بدلاً من بيئة العملية الفرعية الموروثة.
لا تتلقى اتصالات خادم تطبيقات WebSocket رجوع مفاتيح API البيئية من Gateway؛
استخدم ملف تعريف مصادقة صريحاً أو حساب خادم التطبيقات البعيد نفسه.

ترث عمليات تشغيل خادم تطبيقات stdio بيئة عملية OpenClaw افتراضياً، لكن
OpenClaw يملك جسر حساب خادم تطبيقات Codex ويضبط كلاً من `CODEX_HOME` و
`HOME` إلى أدلة لكل وكيل ضمن حالة OpenClaw لذلك الوكيل. يقرأ محمّل Skills
الخاص بـ Codex كلاً من `$CODEX_HOME/skills` و`$HOME/.agents/skills`، لذلك
تُعزل القيمتان لعمليات تشغيل خادم التطبيقات المحلية. يبقي ذلك Skills
والـ plugins والإعدادات والحسابات وحالة الخيوط الأصلية في Codex محصورة في
وكيل OpenClaw بدلاً من تسربها من منزل Codex CLI الشخصي للمشغّل.

لا تزال plugins الخاصة بـ OpenClaw ولقطات Skills في OpenClaw تمر عبر سجل
plugins ومحمّل Skills الخاصين بـ OpenClaw. أما أصول Codex CLI الشخصية فلا تمر.
إذا كانت لديك Skills أو plugins مفيدة في Codex CLI يجب أن تصبح جزءاً من وكيل
OpenClaw، فقم بجردها صراحة:

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

لا يؤثر `appServer.clearEnv` إلا في عملية خادم تطبيقات Codex الفرعية التي جرى
تشغيلها. يظل `CODEX_HOME` و`HOME` محجوزين لعزل Codex لكل وكيل في OpenClaw
عند عمليات التشغيل المحلية.

## الأدوات الديناميكية

تستخدم أدوات Codex الديناميكية تحميل `searchable` افتراضياً. لا يكشف OpenClaw
الأدوات الديناميكية التي تكرر عمليات مساحة العمل الأصلية في Codex:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

تتوفر أدوات تكامل OpenClaw المتبقية، مثل المراسلة والجلسات والوسائط وcron
والمتصفح والعُقد وgateway و`heartbeat_respond` و`web_search`،
من خلال بحث أدوات Codex ضمن مساحة الأسماء `openclaw`. يُبقي هذا سياق
النموذج الأولي أصغر. تبقى `sessions_yield` وردود المصدر الخاصة بأدوات
الرسائل فقط مباشرة لأن تلك عقود تحكم بالدور.

اضبط `codexDynamicToolsLoading: "direct"` فقط عند الاتصال بخادم تطبيقات Codex
مخصص لا يستطيع البحث في الأدوات الديناميكية المؤجلة أو عند تصحيح حمولة
الأدوات الكاملة.

## المهل الزمنية

تُحدَّد استدعاءات الأدوات الديناميكية المملوكة لـ OpenClaw بشكل مستقل عن
`appServer.requestTimeoutMs`. يستخدم كل طلب Codex من نوع `item/tool/call`
أول مهلة متاحة وفق هذا الترتيب:

- وسيط `timeoutMs` موجب لكل استدعاء.
- بالنسبة إلى `image_generate`، القيمة `agents.defaults.imageGenerationModel.timeoutMs`.
- بالنسبة إلى أداة الوسائط `image` لفهم الوسائط، القيمة `tools.media.image.timeoutSeconds`
  محولة إلى مللي ثانية، أو مهلة الوسائط الافتراضية البالغة 60 ثانية.
- القيمة الافتراضية للأداة الديناميكية البالغة 30 ثانية.

تُحدَّد ميزانيات الأدوات الديناميكية بسقف 600000 مللي ثانية. عند انتهاء المهلة،
يلغي OpenClaw إشارة الأداة حيث يكون ذلك مدعوماً ويعيد إلى Codex استجابة أداة
ديناميكية فاشلة كي يستمر الدور بدلاً من ترك الجلسة في حالة `processing`.

بعد أن يستجيب OpenClaw لطلب خادم تطبيقات محدد النطاق بدور من Codex، يتوقع
الحاضن أيضاً أن يُنهي Codex الدور الأصلي باستخدام `turn/completed`. إذا صمت
خادم التطبيقات لمدة `appServer.turnCompletionIdleTimeoutMs` بعد تلك الاستجابة،
يقاطع OpenClaw دور Codex وفق أفضل جهد، ويسجل مهلة تشخيصية، ويحرر مسار جلسة
OpenClaw حتى لا تُصف رسائل الدردشة اللاحقة خلف دور أصلي متقادم.

أي إشعار غير نهائي للدور نفسه، بما في ذلك `rawResponseItem/completed`، يعطل
ذلك المراقب القصير لأن Codex أثبت أن الدور لا يزال حياً. يستمر المراقب النهائي
الأطول في حماية الأدوار العالقة فعلاً. تتضمن تشخيصات المهلة آخر طريقة إشعار
من خادم التطبيقات، وبالنسبة إلى عناصر استجابة المساعد الخام، نوع العنصر ودوره
ومعرّفه ومعاينة محدودة لنص المساعد.

## اكتشاف النماذج

افتراضياً، يطلب Plugin Codex من خادم التطبيقات النماذج المتاحة. تعود ملكية
إتاحة النماذج إلى خادم تطبيقات Codex، لذلك يمكن أن تتغير القائمة عندما يرقي
OpenClaw إصدار `@openai/codex` المضمن أو عندما يوجه نشرٌ ما
`appServer.command` إلى ملف Codex ثنائي مختلف. ويمكن أيضاً أن تكون الإتاحة
مرتبطة بالحساب. استخدم `/codex models` على Gateway قيد التشغيل لرؤية الفهرس
الحي لذلك الحاضن والحساب.

إذا فشل الاكتشاف أو انتهت مهلته، يستخدم OpenClaw فهرساً احتياطياً مضمنًا لـ:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

الحاضن المضمن الحالي هو `@openai/codex` `0.130.0`. أعاد فحص `model/list`
ضد خادم التطبيقات المضمن ذلك ما يلي:

| معرّف النموذج          | الافتراضي | مخفي | وسائط الإدخال | جهود الاستدلال          |
| --------------------- | --------- | ---- | ------------- | ------------------------ |
| `gpt-5.5`             | نعم       | لا   | نص، صورة      | low, medium, high, xhigh |
| `gpt-5.4`             | لا        | لا   | نص، صورة      | low, medium, high, xhigh |
| `gpt-5.4-mini`        | لا        | لا   | نص، صورة      | low, medium, high, xhigh |
| `gpt-5.3-codex`       | لا        | لا   | نص، صورة      | low, medium, high, xhigh |
| `gpt-5.3-codex-spark` | لا        | لا   | نص            | low, medium, high, xhigh |
| `gpt-5.2`             | لا        | لا   | نص، صورة      | low, medium, high, xhigh |

يمكن أن يعيد فهرس خادم التطبيقات نماذج مخفية للتدفقات الداخلية أو المتخصصة،
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

عطّل الاكتشاف عندما تريد أن يتجنب بدء التشغيل فحص Codex وأن يستخدم الفهرس
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

يتعامل Codex مع `AGENTS.md` بنفسه من خلال الاكتشاف الأصلي لوثائق المشروع.
لا يكتب OpenClaw ملفات وثائق مشروع Codex اصطناعية ولا يعتمد على أسماء ملفات
Codex الاحتياطية لملفات الشخصية، لأن احتياطيات Codex لا تنطبق إلا عند غياب
`AGENTS.md`.

لتحقيق تكافؤ مساحة عمل OpenClaw، يحل حاضن Codex ملفات التمهيد الأخرى، بما في
ذلك `SOUL.md` و`TOOLS.md` و`IDENTITY.md` و`USER.md` و`HEARTBEAT.md`
و`BOOTSTRAP.md` و`MEMORY.md` عند وجودها، ويمررها عبر تعليمات مطور Codex في
`thread/start` و`thread/resume`. يُبقي هذا سياق شخصية مساحة العمل والملف
التعريفي مرئياً على مسار Codex الأصلي المخصص لتشكيل السلوك دون تكرار
`AGENTS.md`.

## تجاوزات البيئة

تبقى تجاوزات البيئة متاحة للاختبار المحلي:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

يتجاوز `OPENCLAW_CODEX_APP_SERVER_BIN` الملف الثنائي المُدار عندما تكون
`appServer.command` غير مضبوطة.

أُزيل `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`. استخدم
`plugins.entries.codex.config.appServer.mode: "guardian"` بدلاً منه، أو
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` للاختبار المحلي لمرة واحدة. يُفضَّل
الإعداد لعمليات النشر القابلة للتكرار لأنه يُبقي سلوك Plugin في الملف المراجع
نفسه مثل بقية إعداد حاضن Codex.

## ذات صلة

- [حاضن Codex](/ar/plugins/codex-harness)
- [وقت تشغيل حاضن Codex](/ar/plugins/codex-harness-runtime)
- [Plugins Codex الأصلية](/ar/plugins/codex-native-plugins)
- [استخدام Codex للكمبيوتر](/ar/plugins/codex-computer-use)
- [موفر OpenAI](/ar/providers/openai)
- [مرجع التهيئة](/ar/gateway/configuration-reference)
