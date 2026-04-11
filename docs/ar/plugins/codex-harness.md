---
read_when:
    - تريد استخدام حزام app-server المضمّن الخاص بـ Codex
    - تحتاج إلى مراجع نماذج Codex وأمثلة على الإعداد
    - تريد تعطيل الرجوع الاحتياطي إلى Pi لعمليات النشر المعتمدة على Codex فقط
summary: تشغيل أدوار الوكيل المضمّن في OpenClaw عبر حزام app-server المضمّن الخاص بـ Codex
title: حزام Codex
x-i18n:
    generated_at: "2026-04-11T02:46:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60e1dcf4f1a00c63c3ef31d72feac44bce255421c032c58fa4fd67295b3daf23
    source_path: plugins/codex-harness.md
    workflow: 15
---

# حزام Codex

يتيح plugin المضمّن `codex` لـ OpenClaw تشغيل أدوار الوكيل المضمّن عبر
Codex app-server بدلًا من حزام PI المضمّن.

استخدم هذا عندما تريد أن يتولى Codex جلسة الوكيل منخفضة المستوى: اكتشاف
النماذج، واستئناف الخيوط الأصلي، والضغط الأصلي، وتنفيذ app-server.
ولا يزال OpenClaw يتولى قنوات الدردشة، وملفات الجلسات، واختيار النماذج، والأدوات،
والموافقات، وتسليم الوسائط، ونسخة السجل المرئية.

يكون الحزام معطّلًا افتراضيًا. ولا يُختار إلا عندما يكون plugin ‏`codex`
مفعّلًا ويكون النموذج المحلول نموذجًا من نوع `codex/*`، أو عندما تفرض صراحةً
`embeddedHarness.runtime: "codex"` أو `OPENCLAW_AGENT_RUNTIME=codex`.
إذا لم تضبط `codex/*` مطلقًا، فستحتفظ تشغيلات PI وOpenAI وAnthropic وGemini وlocal
وcustom-provider الحالية بسلوكها الحالي.

## اختر بادئة النموذج الصحيحة

يمتلك OpenClaw مسارات منفصلة للوصول على شكل OpenAI وعلى شكل Codex:

| مرجع النموذج          | مسار وقت التشغيل                              | استخدمه عندما                                                              |
| --------------------- | --------------------------------------------- | -------------------------------------------------------------------------- |
| `openai/gpt-5.4`       | مزوّد OpenAI عبر بنية OpenClaw/PI             | تريد وصولًا مباشرًا إلى OpenAI Platform API باستخدام `OPENAI_API_KEY`.    |
| `openai-codex/gpt-5.4` | مزوّد OpenAI Codex OAuth عبر PI               | تريد ChatGPT/Codex OAuth بدون حزام Codex app-server.                       |
| `codex/gpt-5.4`        | مزوّد Codex المضمّن بالإضافة إلى حزام Codex   | تريد تنفيذ Codex app-server الأصلي لدور الوكيل المضمّن.                    |

لا يطالب حزام Codex إلا بمراجع النماذج `codex/*`. أما مراجع `openai/*`
و`openai-codex/*` وAnthropic وGemini وxAI وlocal ومزوّدي custom الحالية فتحتفظ
بمساراتها المعتادة.

## المتطلبات

- OpenClaw مع plugin ‏`codex` المضمّن المتاح.
- Codex app-server بالإصدار `0.118.0` أو أحدث.
- توفر مصادقة Codex لعملية app-server.

يمنع plugin المصافحات الأقدم أو غير المرقمة مع app-server. وهذا يُبقي
OpenClaw على سطح البروتوكول الذي تم اختباره معه.

بالنسبة إلى اختبارات live وDocker smoke، تأتي المصادقة عادةً من `OPENAI_API_KEY`، مع
ملفات Codex CLI اختيارية مثل `~/.codex/auth.json` و
`~/.codex/config.toml`. استخدم نفس مواد المصادقة التي يستخدمها Codex app-server
المحلي لديك.

## الحد الأدنى من الإعداد

استخدم `codex/gpt-5.4`، وفعّل plugin المضمّن، وافرِض حزام `codex`:

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

يؤدي ضبط `agents.defaults.model` أو نموذج وكيل إلى `codex/<model>` أيضًا إلى
التمكين التلقائي لـ plugin ‏`codex` المضمّن. ويظل إدخال plugin الصريح
مفيدًا في الإعدادات المشتركة لأنه يوضح نية النشر.

## إضافة Codex بدون استبدال النماذج الأخرى

أبقِ `runtime: "auto"` عندما تريد Codex لنماذج `codex/*` وPI
لكل شيء آخر:

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

- يستخدم `/model codex` أو `/model codex/gpt-5.4` حزام Codex app-server.
- يستخدم `/model gpt` أو `/model openai/gpt-5.4` مسار مزوّد OpenAI.
- يستخدم `/model opus` مسار مزوّد Anthropic.
- إذا تم اختيار نموذج غير Codex، يظل PI هو حزام التوافق.

## عمليات النشر المعتمدة على Codex فقط

عطّل الرجوع الاحتياطي إلى PI عندما تحتاج إلى إثبات أن كل دور وكيل مضمّن يستخدم
حزام Codex:

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

تجاوز عبر البيئة:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

مع تعطيل الرجوع الاحتياطي، يفشل OpenClaw مبكرًا إذا كان plugin Codex معطّلًا،
أو إذا لم يكن النموذج المطلوب مرجعًا من نوع `codex/*`، أو إذا كان app-server قديمًا جدًا، أو إذا
تعذر بدء app-server.

## Codex لكل وكيل

يمكنك جعل وكيل واحد يعمل بـ Codex فقط بينما يحتفظ الوكيل الافتراضي
بالاختيار التلقائي المعتاد:

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

استخدم أوامر الجلسة المعتادة للتبديل بين الوكلاء والنماذج. ينشئ `/new`
جلسة OpenClaw جديدة، وينشئ حزام Codex خيط app-server الجانبي أو يستأنفه
عند الحاجة. ويؤدي `/reset` إلى مسح ربط جلسة OpenClaw لذلك الخيط.

## اكتشاف النماذج

افتراضيًا، يطلب plugin ‏Codex من app-server النماذج المتاحة. وإذا
فشل الاكتشاف أو انتهت مهلته، فإنه يستخدم فهرس الرجوع الاحتياطي المضمّن:

- `codex/gpt-5.4`
- `codex/gpt-5.4-mini`
- `codex/gpt-5.2`

يمكنك ضبط الاكتشاف تحت `plugins.entries.codex.config.discovery`:

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

عطّل الاكتشاف عندما تريد أن يتجنب بدء التشغيل فحص Codex ويلتزم
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

## اتصال app-server والسياسة

افتراضيًا، يبدأ plugin ‏Codex محليًا باستخدام:

```bash
codex app-server --listen stdio://
```

يمكنك الإبقاء على هذا الافتراضي وضبط سياسة Codex الأصلية فقط:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            approvalPolicy: "on-request",
            sandbox: "workspace-write",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

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

| الحقل               | الافتراضي                                | المعنى                                                                    |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | تقوم `"stdio"` بتشغيل Codex؛ وتتصل `"websocket"` بـ `url`.               |
| `command`           | `"codex"`                                | الملف التنفيذي لنقل stdio.                                                |
| `args`              | `["app-server", "--listen", "stdio://"]` | الوسائط الخاصة بنقل stdio.                                                |
| `url`               | غير مضبوط                                | عنوان URL الخاص بـ WebSocket app-server.                                  |
| `authToken`         | غير مضبوط                                | رمز Bearer لنقل WebSocket.                                                |
| `headers`           | `{}`                                     | ترويسات WebSocket إضافية.                                                 |
| `requestTimeoutMs`  | `60000`                                  | المهلة الخاصة باستدعاءات control-plane إلى app-server.                    |
| `approvalPolicy`    | `"never"`                                | سياسة موافقات Codex الأصلية المرسلة عند بدء الخيط/استئنافه/دوره.          |
| `sandbox`           | `"workspace-write"`                      | وضع Codex sandbox الأصلي المرسل عند بدء الخيط/استئنافه.                   |
| `approvalsReviewer` | `"user"`                                 | استخدم `"guardian_subagent"` للسماح لـ Codex guardian بمراجعة الموافقات الأصلية. |
| `serviceTier`       | غير مضبوط                                | طبقة خدمة Codex اختيارية، على سبيل المثال `"priority"`.                  |

ما زالت متغيرات البيئة الأقدم تعمل كخيارات رجوع احتياطي للاختبار المحلي عندما
يكون حقل الإعداد المطابق غير مضبوط:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`
- `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`

ويُفضَّل الإعداد لعمليات النشر القابلة للتكرار.

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

التحقق من حزام Codex فقط، مع تعطيل الرجوع الاحتياطي إلى PI:

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

app-server بعيد مع ترويسات صريحة:

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

يظل تبديل النماذج تحت تحكم OpenClaw. وعندما تُربط جلسة OpenClaw
بخيط Codex موجود، يرسل الدور التالي النموذج `codex/*`
والمزوّد وسياسة الموافقة وsandbox وservice tier المحددة حاليًا إلى
app-server مرة أخرى. ويؤدي التبديل من `codex/gpt-5.4` إلى `codex/gpt-5.2` إلى الإبقاء على
ربط الخيط، لكنه يطلب من Codex المتابعة باستخدام النموذج المحدد حديثًا.

## أمر Codex

يسجل plugin المضمّن الأمر `/codex` كأمر slash مصرّح به. وهو
عام ويعمل على أي قناة تدعم أوامر OpenClaw النصية.

الصيغ الشائعة:

- يعرض `/codex status` الاتصال المباشر بـ app-server، والنماذج، والحساب، وحدود المعدل، وخوادم MCP، وSkills.
- يعرض `/codex models` نماذج Codex app-server المباشرة.
- يعرض `/codex threads [filter]` خيوط Codex الحديثة.
- يربط `/codex resume <thread-id>` جلسة OpenClaw الحالية بخيط Codex موجود.
- يطلب `/codex compact` من Codex app-server ضغط الخيط المرتبط.
- يبدأ `/codex review` مراجعة Codex الأصلية للخيط المرتبط.
- يعرض `/codex account` حالة الحساب وحدود المعدل.
- يعرض `/codex mcp` حالة خادم MCP في Codex app-server.
- يعرض `/codex skills` Skills الخاصة بـ Codex app-server.

يكتب `/codex resume` ملف الربط الجانبي نفسه الذي يستخدمه الحزام في
الأدوار العادية. وفي الرسالة التالية، يستأنف OpenClaw ذلك الخيط من Codex، ويمرر
نموذج OpenClaw الحالي `codex/*` المحدد إلى app-server، ويُبقي
السجل الموسع مفعّلًا.

يتطلب سطح الأوامر Codex app-server بالإصدار `0.118.0` أو أحدث. وتُبلّغ
طرائق التحكم الفردية على أنها `unsupported by this Codex app-server` إذا كان
app-server مستقبليًا أو مخصصًا لا يوفّر طريقة JSON-RPC تلك.

## الأدوات والوسائط والضغط

لا يغيّر حزام Codex سوى منفّذ الوكيل المضمّن منخفض المستوى.

يواصل OpenClaw بناء قائمة الأدوات واستقبال نتائج الأدوات الديناميكية من
الحزام. ويستمر تمرير النصوص والصور والفيديو والموسيقى وTTS والموافقات ومخرجات
أدوات المراسلة عبر مسار التسليم المعتاد في OpenClaw.

عندما يستخدم النموذج المحدد حزام Codex، يُفوَّض ضغط الخيوط الأصلي إلى
Codex app-server. ويحتفظ OpenClaw بنسخة مرآة من السجل من أجل سجل القنوات،
والبحث، و`/new`، و`/reset`، والتبديل المستقبلي للنموذج أو الحزام. وتشمل
النسخة المرآة مطالبة المستخدم، ونص المساعد النهائي، وسجلات استدلال أو خطة
خفيفة من Codex عندما يصدرها app-server.

لا يتطلب توليد الوسائط PI. إذ تواصل الصور والفيديو والموسيقى وPDF وTTS وفهم
الوسائط استخدام إعدادات المزوّد/النموذج المطابقة مثل
`agents.defaults.imageGenerationModel` و`videoGenerationModel` و`pdfModel` و
`messages.tts`.

## استكشاف الأخطاء وإصلاحها

**لا يظهر Codex في `/model`:** فعّل `plugins.entries.codex.enabled`،
واضبط مرجع نموذج `codex/*`، أو تحقق مما إذا كان `plugins.allow` يستبعد `codex`.

**يرجع OpenClaw احتياطيًا إلى PI:** اضبط `embeddedHarness.fallback: "none"` أو
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` أثناء الاختبار.

**يتم رفض app-server:** حدّث Codex بحيث تُبلغ مصافحة app-server
عن الإصدار `0.118.0` أو أحدث.

**اكتشاف النماذج بطيء:** خفّض `plugins.entries.codex.config.discovery.timeoutMs`
أو عطّل الاكتشاف.

**يفشل نقل WebSocket فورًا:** تحقّق من `appServer.url` و`authToken`،
ومن أن app-server البعيد يتحدث نفس إصدار بروتوكول Codex app-server.

**يستخدم نموذج غير Codex ‏PI:** هذا متوقع. فحزام Codex لا يطالب إلا
بمراجع النماذج `codex/*`.

## ذو صلة

- [Agent Harness Plugins](/ar/plugins/sdk-agent-harness)
- [Model Providers](/ar/concepts/model-providers)
- [Configuration Reference](/ar/gateway/configuration-reference)
- [Testing](/ar/help/testing#live-codex-app-server-harness-smoke)
