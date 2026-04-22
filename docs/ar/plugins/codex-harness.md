---
read_when:
    - تريد استخدام حزمة تسخير app-server الخاصة بـ Codex
    - تحتاج إلى مراجع نماذج Codex وأمثلة على الإعدادات
    - تريد تعطيل الرجوع الاحتياطي إلى Pi لعمليات النشر الخاصة بـ Codex فقط
summary: شغّل أدوار الوكيل المضمّن في OpenClaw عبر حزمة تسخير app-server الخاصة بـ Codex
title: حزمة تسخير Codex
x-i18n:
    generated_at: "2026-04-22T07:17:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: d45dbd39a7d8ebb3a39d8dca3a5125c07b7168d1658ca07b85792645fb98613c
    source_path: plugins/codex-harness.md
    workflow: 15
---

# حزمة تسخير Codex

يتيح Plugin `codex` المضمّن لـ OpenClaw تشغيل أدوار الوكيل المضمّن عبر
خادم تطبيقات Codex بدلًا من حزمة تسخير PI المدمجة.

استخدم هذا عندما تريد أن يتولى Codex جلسة الوكيل منخفضة المستوى: اكتشاف
النموذج، والاستئناف الأصلي للخيط، وCompaction الأصلية، والتنفيذ عبر خادم
التطبيقات. يظل OpenClaw مسؤولًا عن قنوات الدردشة، وملفات الجلسات، واختيار
النموذج، والأدوات، والموافقات، وتسليم الوسائط، ونسخة السجل الظاهرة.

تكون حزمة التسخير معطّلة افتراضيًا. ويتم اختيارها فقط عندما يكون Plugin `codex`
مفعّلًا ويكون النموذج المحلول نموذجًا من نوع `codex/*`، أو عندما تفرض صراحةً
`embeddedHarness.runtime: "codex"` أو `OPENCLAW_AGENT_RUNTIME=codex`.
إذا لم تقم مطلقًا بتهيئة `codex/*`، فستحافظ تشغيلات PI وOpenAI وAnthropic وGemini وlocal
وcustom-provider الحالية على سلوكها الحالي.

## اختر بادئة النموذج المناسبة

يحتوي OpenClaw على مسارات منفصلة للوصول على هيئة OpenAI والوصول على هيئة Codex:

| مرجع النموذج          | مسار وقت التشغيل                              | استخدم هذا عندما                                                          |
| --------------------- | --------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`      | مزود OpenAI عبر بنية OpenClaw/PI              | تريد وصولًا مباشرًا إلى OpenAI Platform API باستخدام `OPENAI_API_KEY`.   |
| `openai-codex/gpt-5.4` | مزود OpenAI Codex OAuth عبر PI               | تريد ChatGPT/Codex OAuth من دون حزمة تسخير خادم تطبيقات Codex.          |
| `codex/gpt-5.4`       | مزود Codex المضمّن بالإضافة إلى حزمة تسخير Codex | تريد تنفيذًا أصليًا عبر خادم تطبيقات Codex لدور الوكيل المضمّن.       |

لا تتولى حزمة تسخير Codex إلا مراجع النماذج `codex/*`. أما مراجع `openai/*`
و`openai-codex/*` وAnthropic وGemini وxAI وlocal وcustom provider الحالية فتبقى
على مساراتها العادية.

## المتطلبات

- OpenClaw مع توفر Plugin `codex` المضمّن.
- خادم تطبيقات Codex بالإصدار `0.118.0` أو أحدث.
- توفر مصادقة Codex لعملية خادم التطبيقات.

يحظر Plugin مصافحات خادم التطبيقات الأقدم أو غير ذات الإصدار. وهذا يُبقي
OpenClaw على سطح البروتوكول الذي تم اختباره عليه.

في اختبارات التشغيل الحي واختبارات Docker الدخانية، تأتي المصادقة عادةً من
`OPENAI_API_KEY`، بالإضافة إلى ملفات Codex CLI الاختيارية مثل `~/.codex/auth.json` و
`~/.codex/config.toml`. استخدم مواد المصادقة نفسها التي يستخدمها خادم تطبيقات Codex المحلي لديك.

## الحد الأدنى من الإعدادات

استخدم `codex/gpt-5.4`، وفعّل Plugin المضمّن، وافرِض حزمة تسخير `codex`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

إذا كان إعدادك يستخدم `plugins.allow`، فأدرج `codex` هناك أيضًا:

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

كما أن تعيين `agents.defaults.model` أو نموذج وكيل إلى `codex/<model>` يؤدي أيضًا
إلى التفعيل التلقائي لـ Plugin `codex` المضمّن. وتظل إضافة Plugin الصريحة مفيدة
في الإعدادات المشتركة لأنها توضّح نية النشر بوضوح.

## أضف Codex من دون استبدال النماذج الأخرى

أبقِ `runtime: "auto"` عندما تريد Codex لنماذج `codex/*` وPI لكل
شيء آخر:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: {
        primary: "codex/gpt-5.4",
        fallbacks: ["openai/gpt-5.4", "anthropic/claude-opus-4-6"],
      },
      models: {
        "codex/gpt-5.4": { alias: "codex" },
        "codex/gpt-5.4-mini": { alias: "codex-mini" },
        "openai/gpt-5.4": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
  },
}
```

مع هذا الشكل:

- يستخدم `/model codex` أو `/model codex/gpt-5.4` حزمة تسخير خادم تطبيقات Codex.
- يستخدم `/model gpt` أو `/model openai/gpt-5.4` مسار مزود OpenAI.
- يستخدم `/model opus` مسار مزود Anthropic.
- إذا تم اختيار نموذج غير Codex، يظل PI هو حزمة التسخير التوافقية.

## عمليات النشر الخاصة بـ Codex فقط

عطّل الرجوع الاحتياطي إلى PI عندما تحتاج إلى إثبات أن كل دور للوكيل المضمّن يستخدم
حزمة تسخير Codex:

```json5
{
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

تجاوز البيئة:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

عند تعطيل الرجوع الاحتياطي، يفشل OpenClaw مبكرًا إذا كان Plugin Codex معطّلًا،
أو إذا لم يكن النموذج المطلوب مرجعًا من نوع `codex/*`، أو إذا كان خادم التطبيقات قديمًا جدًا،
أو إذا تعذر بدء خادم التطبيقات.

## Codex لكل وكيل

يمكنك جعل وكيل واحد يعمل بـ Codex فقط بينما يحتفظ الوكيل الافتراضي
بالاختيار التلقائي العادي:

```json5
{
  agents: {
    defaults: {
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "codex/gpt-5.4",
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

استخدم أوامر الجلسة العادية للتبديل بين الوكلاء والنماذج. ينشئ `/new` جلسة
OpenClaw جديدة، وتقوم حزمة تسخير Codex بإنشاء خيط خادم التطبيقات الجانبي أو
استئنافه حسب الحاجة. يقوم `/reset` بمسح ربط جلسة OpenClaw لذلك الخيط.

## اكتشاف النموذج

افتراضيًا، يطلب Plugin Codex من خادم التطبيقات النماذج المتاحة. إذا فشل
الاكتشاف أو انتهت مهلته، فإنه يستخدم فهرس الرجوع الاحتياطي المضمّن:

- `codex/gpt-5.4`
- `codex/gpt-5.4-mini`
- `codex/gpt-5.2`

يمكنك ضبط الاكتشاف ضمن `plugins.entries.codex.config.discovery`:

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

عطّل الاكتشاف عندما تريد أن يتجنب بدء التشغيل فحص Codex وأن يلتزم
بفهرس الرجوع الاحتياطي:

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

## اتصال خادم التطبيقات والسياسة

افتراضيًا، يبدأ Plugin Codex محليًا باستخدام:

```bash
codex app-server --listen stdio://
```

افتراضيًا، يطلب OpenClaw من Codex طلب موافقات أصلية. ويمكنك ضبط هذه
السياسة بشكل أكبر، مثل تشديدها وتوجيه المراجعات عبر guardian:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            approvalPolicy: "untrusted",
            approvalsReviewer: "guardian_subagent",
            sandbox: "workspace-write",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

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
            url: "ws://127.0.0.1:39175",
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

| الحقل               | الافتراضي                                 | المعنى                                                                    |
| ------------------- | ----------------------------------------- | ------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                 | تؤدي `"stdio"` إلى تشغيل Codex؛ وتؤدي `"websocket"` إلى الاتصال بـ `url`. |
| `command`           | `"codex"`                                 | الملف التنفيذي لنقل stdio.                                                |
| `args`              | `["app-server", "--listen", "stdio://"]`  | الوسيطات الخاصة بنقل stdio.                                               |
| `url`               | غير معيّن                                 | عنوان URL لخادم تطبيقات WebSocket.                                        |
| `authToken`         | غير معيّن                                 | Bearer token لنقل WebSocket.                                              |
| `headers`           | `{}`                                      | ترويسات WebSocket إضافية.                                                 |
| `requestTimeoutMs`  | `60000`                                   | المهلة الزمنية لاستدعاءات مستوى التحكم الخاصة بخادم التطبيقات.            |
| `approvalPolicy`    | `"on-request"`                            | سياسة موافقات Codex الأصلية المُرسلة إلى بدء/استئناف/دور الخيط.         |
| `sandbox`           | `"workspace-write"`                       | وضع sandbox الأصلي في Codex المُرسل إلى بدء/استئناف الخيط.               |
| `approvalsReviewer` | `"user"`                                  | استخدم `"guardian_subagent"` للسماح لـ guardian في Codex بمراجعة الموافقات الأصلية. |
| `serviceTier`       | غير معيّن                                 | طبقة خدمة Codex اختيارية، مثل `"priority"`.                              |

لا تزال متغيرات البيئة الأقدم تعمل كخيارات رجوع احتياطي للاختبارات المحلية عندما
يكون حقل الإعداد المطابق غير معيّن:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`
- `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`

تُفضَّل الإعدادات لعمليات النشر القابلة لإعادة الإنتاج.

## وصفات شائعة

Codex محلي مع نقل stdio الافتراضي:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

التحقق من حزمة تسخير Codex فقط، مع تعطيل الرجوع الاحتياطي إلى PI:

```json5
{
  embeddedHarness: {
    fallback: "none",
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

موافقات Codex التي يراجعها guardian:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            approvalPolicy: "on-request",
            approvalsReviewer: "guardian_subagent",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

خادم تطبيقات بعيد مع ترويسات صريحة:

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
            headers: {
              "X-OpenClaw-Agent": "main",
            },
          },
        },
      },
    },
  },
}
```

يبقى تبديل النموذج تحت تحكم OpenClaw. عندما تكون جلسة OpenClaw مرفقة
بخيط Codex موجود، يرسل الدور التالي النموذج المحدد حاليًا من نوع
`codex/*`، والمزود، وسياسة الموافقة، وsandbox، وطبقة الخدمة إلى
خادم التطبيقات مرة أخرى. يؤدي التبديل من `codex/gpt-5.4` إلى `codex/gpt-5.2`
إلى الإبقاء على ربط الخيط، لكنه يطلب من Codex المتابعة بالنموذج المحدد حديثًا.

## أمر Codex

يسجل Plugin المضمّن `/codex` بوصفه أمر slash مصرحًا به. وهو
عام ويعمل على أي قناة تدعم أوامر OpenClaw النصية.

الصيغ الشائعة:

- يعرض `/codex status` حالة الاتصال الحي بخادم التطبيقات، والنماذج، والحساب، وحدود المعدل، وخوادم MCP، وSkills.
- يسرد `/codex models` نماذج خادم تطبيقات Codex الحية.
- يسرد `/codex threads [filter]` خيوط Codex الحديثة.
- يربط `/codex resume <thread-id>` جلسة OpenClaw الحالية بخيط Codex موجود.
- يطلب `/codex compact` من خادم تطبيقات Codex إجراء Compaction للخيط المرفق.
- يبدأ `/codex review` المراجعة الأصلية في Codex للخيط المرفق.
- يعرض `/codex account` حالة الحساب وحدود المعدل.
- يسرد `/codex mcp` حالة خادم MCP في خادم تطبيقات Codex.
- يسرد `/codex skills` Skills في خادم تطبيقات Codex.

يكتب `/codex resume` ملف ربط sidecar نفسه الذي تستخدمه حزمة التسخير في
الأدوار العادية. في الرسالة التالية، يستأنف OpenClaw خيط Codex ذلك، ويمرر
نموذج OpenClaw `codex/*` المحدد حاليًا إلى خادم التطبيقات، ويحافظ على
تفعيل السجل الموسّع.

يتطلب سطح الأوامر خادم تطبيقات Codex بالإصدار `0.118.0` أو أحدث. ويتم
الإبلاغ عن أساليب التحكم الفردية على أنها `unsupported by this Codex app-server` إذا كان
خادم تطبيقات مستقبلي أو مخصص لا يكشف أسلوب JSON-RPC هذا.

## الأدوات والوسائط وCompaction

تغيّر حزمة تسخير Codex منفّذ الوكيل المضمّن منخفض المستوى فقط.

يواصل OpenClaw إنشاء قائمة الأدوات واستقبال نتائج الأدوات الديناميكية من
حزمة التسخير. وتستمر النصوص والصور والفيديو والموسيقى وTTS والموافقات
ومخرجات أدوات المراسلة عبر مسار التسليم العادي في OpenClaw.

عندما يستخدم النموذج المحدد حزمة تسخير Codex، يتم تفويض Compaction
الأصلية للخيط إلى خادم تطبيقات Codex. يحتفظ OpenClaw بنسخة معكوسة من
السجل من أجل سجل القناة، والبحث، و`/new`، و`/reset`، وعمليات التبديل
المستقبلية للنموذج أو حزمة التسخير. وتتضمن النسخة المعكوسة مطالبة المستخدم،
ونص المساعد النهائي، وسجلات reasoning أو الخطة الخفيفة الخاصة بـ Codex عندما
يصدرها خادم التطبيقات.

لا يتطلب إنشاء الوسائط PI. وتستمر عملية إنشاء الصور والفيديو والموسيقى وPDF
وTTS وفهم الوسائط في استخدام إعدادات المزود/النموذج المطابقة مثل
`agents.defaults.imageGenerationModel` و`videoGenerationModel` و`pdfModel` و
`messages.tts`.

## استكشاف الأخطاء وإصلاحها

**لا يظهر Codex في `/model`:** فعّل `plugins.entries.codex.enabled`،
واضبط مرجع نموذج `codex/*`، أو تحقق مما إذا كان `plugins.allow` يستبعد `codex`.

**يستخدم OpenClaw PI بدلًا من Codex:** إذا لم تطالب أي حزمة تسخير Codex
بهذا التشغيل، فقد يستخدم OpenClaw PI كخلفية توافقية. اضبط
`embeddedHarness.runtime: "codex"` لفرض اختيار Codex أثناء الاختبار، أو
`embeddedHarness.fallback: "none"` للفشل عندما لا تتطابق أي حزمة تسخير Plugin. بمجرد
اختيار خادم تطبيقات Codex، تظهر أعطاله مباشرةً من دون إعدادات رجوع احتياطي إضافية.

**يتم رفض خادم التطبيقات:** حدّث Codex بحيث تُبلغ مصافحة خادم التطبيقات
عن الإصدار `0.118.0` أو أحدث.

**اكتشاف النموذج بطيء:** خفّض `plugins.entries.codex.config.discovery.timeoutMs`
أو عطّل الاكتشاف.

**يفشل نقل WebSocket فورًا:** تحقق من `appServer.url` و`authToken`،
ومن أن خادم التطبيقات البعيد يتحدث بإصدار بروتوكول خادم تطبيقات Codex نفسه.

**يستخدم نموذج غير Codex PI:** هذا متوقع. لا تطالب حزمة تسخير Codex إلا
بمراجع النماذج `codex/*`.

## ذو صلة

- [Plugins حزمة تسخير الوكيل](/ar/plugins/sdk-agent-harness)
- [مزودو النماذج](/ar/concepts/model-providers)
- [مرجع الإعدادات](/ar/gateway/configuration-reference)
- [الاختبار](/ar/help/testing#live-codex-app-server-harness-smoke)
