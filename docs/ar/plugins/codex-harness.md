---
read_when:
    - تريد استخدام Codex app-server harness المجمّعة
    - تحتاج إلى مراجع نماذج Codex وأمثلة للإعداد +#+#+#+#+#+analysis to=final code  omitted because just translate remaining user content
    - تريد تعطيل الرجوع الاحتياطي لـ PI لعمليات النشر الخاصة بـ Codex فقط
summary: تشغيل أدوار الوكيل المضمّن في OpenClaw عبر حزمة app-server harness المجمّعة الخاصة بـ Codex
title: Codex harness
x-i18n:
    generated_at: "2026-04-24T07:53:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: c02b1e6cbaaefee858db7ebd7e306261683278ed9375bca6fe74855ca84eabd8
    source_path: plugins/codex-harness.md
    workflow: 15
---

تتيح Plugin ‏`codex` المجمّعة لـ OpenClaw تشغيل أدوار الوكيل المضمّن عبر
Codex app-server بدلًا من PI harness المدمجة.

استخدم هذا عندما تريد أن يملك Codex الجلسة منخفضة المستوى الخاصة بالوكيل: اكتشاف
النموذج، واستئناف سلاسل الرسائل الأصلية، وCompaction الأصلية، وتنفيذ app-server.
ولا يزال OpenClaw يملك قنوات الدردشة، وملفات الجلسات، واختيار النموذج، والأدوات،
والموافقات، وتسليم الوسائط، ومرآة النص المرئي.

تحافظ أدوار Codex الأصلية على hooks الخاصة بـ OpenClaw كطبقة التوافق العامة.
هذه هي hooks داخل عملية OpenClaw، وليست hooks أوامر `hooks.json` الخاصة بـ Codex:

- `before_prompt_build`
- `before_compaction`، `after_compaction`
- `llm_input`، `llm_output`
- `after_tool_call`
- `before_message_write` لسجلات النص المعكوسة
- `agent_end`

يمكن للإضافات المجمّعة أيضًا تسجيل مصنع امتداد لـ Codex app-server لإضافة
برمجيات وسيطة غير متزامنة من نوع `tool_result`. تعمل هذه البرمجيات الوسيطة لأدوات OpenClaw الديناميكية
بعد أن ينفذ OpenClaw الأداة وقبل إعادة النتيجة إلى Codex. وهي
منفصلة عن hook العامة `tool_result_persist` الخاصة بـ Plugin، التي تحوّل
عمليات كتابة نتائج الأدوات في النصوص المملوكة لـ OpenClaw.

تكون harness معطلة افتراضيًا. ينبغي أن تحافظ الإعدادات الجديدة على مراجع نماذج OpenAI
بصورتها القياسية `openai/gpt-*` وأن تفرض صراحةً
`embeddedHarness.runtime: "codex"` أو `OPENCLAW_AGENT_RUNTIME=codex` عندما
تريد تنفيذ app-server الأصلي. ولا تزال مراجع النماذج القديمة `codex/*` تختار harness تلقائيًا
من أجل التوافق.

## اختر بادئة النموذج الصحيحة

تكون مسارات عائلة OpenAI حساسة للبادئة. استخدم `openai-codex/*` عندما تريد
Codex OAuth عبر PI؛ واستخدم `openai/*` عندما تريد وصول OpenAI API مباشرًا أو
عندما تفرض Codex app-server harness الأصلية:

| مرجع النموذج | مسار التشغيل | استخدمه عندما |
| ----------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4` | مزود OpenAI عبر بنية OpenClaw/PI | تريد وصول OpenAI Platform API مباشرًا حاليًا مع `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5` | OpenAI Codex OAuth عبر OpenClaw/PI | تريد مصادقة اشتراك ChatGPT/Codex مع مشغّل PI الافتراضي. |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex app-server harness | تريد تنفيذ Codex app-server الأصلي لدور الوكيل المضمّن. |

يكون GPT-5.5 حاليًا اشتراكًا/‏OAuth فقط في OpenClaw. استخدم
`openai-codex/gpt-5.5` لـ PI OAuth، أو `openai/gpt-5.5` مع Codex
app-server harness. وسيصبح الوصول المباشر عبر API key لـ `openai/gpt-5.5` مدعومًا
بمجرد أن تفعّل OpenAI نموذج GPT-5.5 على API العامة.

لا تزال مراجع `codex/gpt-*` القديمة مقبولة كأسماء بديلة للتوافق. ويجب على إعدادات
PI Codex OAuth الجديدة استخدام `openai-codex/gpt-*`؛ أما إعدادات
app-server harness الأصلية الجديدة فيجب أن تستخدم `openai/gpt-*` بالإضافة إلى `embeddedHarness.runtime:
"codex"`.

يتبع `agents.defaults.imageModel` الانقسام نفسه في البادئة. استخدم
`openai-codex/gpt-*` عندما يجب أن يعمل فهم الصور عبر مسار مزود OpenAI
Codex OAuth. واستخدم `codex/gpt-*` عندما يجب أن يعمل فهم الصور
عبر دور Codex app-server محدود. ويجب أن يعلن نموذج Codex app-server
عن دعم إدخال الصور؛ أما نماذج Codex النصية فقط فتفشل قبل بدء
دور الوسائط.

استخدم `/status` لتأكيد harness الفعلية للجلسة الحالية. وإذا كان
الاختيار مفاجئًا، ففعّل تسجيل التصحيح للنظام الفرعي `agents/harness`
وافحص السجل المنظم في gateway بعنوان `agent harness selected`. فهو
يتضمن معرّف harness المحدد، وسبب الاختيار، وسياسة التشغيل/الرجوع الاحتياطي، و،
في وضع `auto`، نتيجة دعم كل مرشح من Plugins.

لا يُعد اختيار harness أداة تحكم مباشرة في الجلسة. فعندما يُشغَّل دور مضمّن،
يسجل OpenClaw معرّف harness المحدد على تلك الجلسة ويستمر في استخدامه في
الأدوار اللاحقة ضمن معرّف الجلسة نفسه. غيّر إعداد `embeddedHarness` أو
`OPENCLAW_AGENT_RUNTIME` عندما تريد أن تستخدم الجلسات المستقبلية harness أخرى؛
واستخدم `/new` أو `/reset` لبدء جلسة جديدة قبل تبديل محادثة موجودة
بين PI وCodex. فهذا يتجنب إعادة تشغيل نص واحد عبر
نظامي جلسات أصليين غير متوافقين.

تُعامل الجلسات القديمة التي أُنشئت قبل تثبيت harness على أنها مثبتة إلى PI بمجرد
أن يكون لديها سجل نصي. استخدم `/new` أو `/reset` لاختيار Codex لتلك المحادثة
بعد تغيير الإعداد.

يعرض `/status` harness الفعلية غير PI بجانب `Fast`، مثل
`Fast · codex`. أما PI harness الافتراضية فتظل `Runner: pi (embedded)` ولا
تضيف شارة harness منفصلة.

## المتطلبات

- OpenClaw مع توفر Plugin ‏`codex` المجمّعة.
- Codex app-server ‏`0.118.0` أو أحدث.
- توفر مصادقة Codex لعملية app-server.

تحظر Plugin المصافحات القديمة أو غير المصدرة للإصدار الخاصة بـ app-server. ويُبقي هذا
OpenClaw على سطح البروتوكول الذي اختُبرت عليه.

في الاختبارات الحية واختبارات Docker smoke، تأتي المصادقة عادةً من `OPENAI_API_KEY`، بالإضافة إلى
ملفات Codex CLI الاختيارية مثل `~/.codex/auth.json` و
`~/.codex/config.toml`. استخدم مواد المصادقة نفسها التي يستخدمها Codex app-server المحلي
لديك.

## إعداد أدنى

استخدم `openai/gpt-5.5`، وفعّل Plugin المجمّعة، وافرِض harness ‏`codex`:

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
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

إذا كانت إعداداتك تستخدم `plugins.allow`، فضمّن `codex` هناك أيضًا:

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

الإعدادات القديمة التي تضبط `agents.defaults.model` أو نموذج وكيل إلى
`codex/<model>` لا تزال تفعّل Plugin ‏`codex` المجمّعة تلقائيًا. وينبغي أن
تفضّل الإعدادات الجديدة `openai/<model>` مع إدخال `embeddedHarness` الصريح أعلاه.

## أضف Codex من دون استبدال النماذج الأخرى

أبقِ `runtime: "auto"` عندما تريد لمراجع `codex/*` القديمة أن تختار Codex وأن
تختار PI لكل شيء آخر. أما في الإعدادات الجديدة، ففضّل `runtime: "codex"` الصريحة على
الوكلاء الذين يجب أن يستخدموا harness.

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
        primary: "openai/gpt-5.5",
        fallbacks: ["openai/gpt-5.5", "anthropic/claude-opus-4-6"],
      },
      models: {
        "openai/gpt-5.5": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "codex",
        fallback: "pi",
      },
    },
  },
}
```

مع هذا الشكل:

- يؤدي `/model gpt` أو `/model openai/gpt-5.5` إلى استخدام Codex app-server harness في هذا الإعداد.
- يؤدي `/model opus` إلى استخدام مسار مزود Anthropic.
- إذا تم اختيار نموذج غير تابع لـ Codex، تبقى PI هي harness التوافقية.

## عمليات النشر الخاصة بـ Codex فقط

عطّل الرجوع الاحتياطي لـ PI عندما تحتاج إلى إثبات أن كل دور وكيل مضمّن يستخدم
Codex harness:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
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

مع تعطيل الرجوع الاحتياطي، يفشل OpenClaw مبكرًا إذا كانت Plugin ‏Codex معطّلة،
أو كان app-server قديمًا جدًا، أو تعذر بدء app-server.

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
        model: "openai/gpt-5.5",
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

استخدم أوامر الجلسة العادية لتبديل الوكلاء والنماذج. ينشئ `/new` جلسة
OpenClaw جديدة، وتقوم Codex harness بإنشاء أو استئناف سلسلة الرسائل الجانبية لـ app-server
عند الحاجة. أما `/reset` فيمسح ربط جلسة OpenClaw لتلك السلسلة
ويجعل الدور التالي يحل harness من الإعداد الحالي مجددًا.

## اكتشاف النموذج

افتراضيًا، تطلب Plugin ‏Codex من app-server النماذج المتاحة. وإذا
فشل الاكتشاف أو انتهت مهلته، فإنها تستخدم فهرسًا احتياطيًا مجمّعًا للنماذج التالية:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

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

عطّل الاكتشاف عندما تريد أن يتجنب بدء التشغيل فحص Codex والالتزام
بالفهرس الاحتياطي:

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

افتراضيًا، تبدأ Plugin ‏Codex محليًا باستخدام:

```bash
codex app-server --listen stdio://
```

افتراضيًا، يبدأ OpenClaw جلسات Codex harness المحلية في وضع YOLO:
`approvalPolicy: "never"`، و`approvalsReviewer: "user"`، و
`sandbox: "danger-full-access"`. وهذه هي وضعية المشغّل المحلي الموثوق المستخدمة
لـ Heartbeats الذاتية: إذ يستطيع Codex استخدام أدوات shell والشبكة من دون
التوقف عند مطالبات الموافقة الأصلية التي لا يوجد أحد حاضر للإجابة عنها.

للاشتراك في موافقات Codex التي يراجعها guardian، اضبط `appServer.mode:
"guardian"`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "fast",
          },
        },
      },
    },
  },
}
```

يُعد Guardian مراجع موافقات أصليًا في Codex. عندما يطلب Codex مغادرة sandbox، أو الكتابة خارج مساحة العمل، أو إضافة أذونات مثل الوصول إلى الشبكة، فإنه يوجّه طلب الموافقة هذا إلى وكيل فرعي مراجع بدلًا من مطالبة بشرية. ويطبق المراجع إطار المخاطر الخاص بـ Codex ويوافق على الطلب المحدد أو يرفضه. استخدم Guardian عندما تريد مزيدًا من الحواجز الوقائية مقارنةً بوضع YOLO لكنك لا تزال تحتاج إلى أن تحرز الوكلاء غير المراقبين تقدمًا.

يتوسع الضبط المسبق `guardian` إلى `approvalPolicy: "on-request"`، و`approvalsReviewer: "guardian_subagent"`، و`sandbox: "workspace-write"`. ولا تزال حقول السياسة الفردية تتجاوز `mode`، لذلك يمكن لعمليات النشر المتقدمة مزج الضبط المسبق مع اختيارات صريحة.

بالنسبة إلى app-server تعمل بالفعل، استخدم WebSocket transport:

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

| الحقل | الافتراضي | المعنى |
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `transport` | `"stdio"` | يقوم `"stdio"` بتشغيل Codex؛ بينما يتصل `"websocket"` بـ `url`. |
| `command` | `"codex"` | الملف التنفيذي لنقل stdio. |
| `args` | `["app-server", "--listen", "stdio://"]` | الوسائط الخاصة بنقل stdio. |
| `url` | غير مضبوط | عنوان URL لـ WebSocket app-server. |
| `authToken` | غير مضبوط | رمز Bearer لنقل WebSocket. |
| `headers` | `{}` | ترويسات WebSocket إضافية. |
| `requestTimeoutMs` | `60000` | المهلة الزمنية لاستدعاءات مستوى التحكم في app-server. |
| `mode` | `"yolo"` | ضبط مسبق لتنفيذ YOLO أو التنفيذ الذي يراجعه guardian. |
| `approvalPolicy` | `"never"` | سياسة الموافقة الأصلية لـ Codex المرسلة عند بدء/استئناف/دور سلسلة الرسائل. |
| `sandbox` | `"danger-full-access"` | وضع sandbox الأصلي لـ Codex المُرسل عند بدء/استئناف سلسلة الرسائل. |
| `approvalsReviewer` | `"user"` | استخدم `"guardian_subagent"` للسماح لـ Codex Guardian بمراجعة المطالبات. |
| `serviceTier` | غير مضبوط | مستوى خدمة اختياري لـ Codex app-server: ‏`"fast"` أو `"flex"` أو `null`. ويتم تجاهل القيم القديمة غير الصالحة. |

لا تزال متغيرات البيئة الأقدم تعمل كبدائل احتياطية للاختبار المحلي عندما
يكون الحقل المطابق في الإعداد غير مضبوط:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

تمت إزالة `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`. استخدم
`plugins.entries.codex.config.appServer.mode: "guardian"` بدلًا من ذلك، أو
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` للاختبار المحلي لمرة واحدة. ويُفضَّل الإعداد
لعمليات النشر القابلة للتكرار لأنه يُبقي سلوك Plugin في
الملف المُراجَع نفسه مع بقية إعداد Codex harness.

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

التحقق من Codex-only harness، مع تعطيل الرجوع الاحتياطي لـ PI:

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

موافقات Codex التي يراجعها Guardian:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
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

app-server بعيدة مع ترويسات صريحة:

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

يبقى تبديل النموذج تحت تحكم OpenClaw. عندما تكون جلسة OpenClaw مرتبطة
بسلسلة Codex موجودة، يرسل الدور التالي النموذج المحدد حاليًا
والمزوّد، وسياسة الموافقة، وsandbox، ومستوى الخدمة إلى
app-server مرة أخرى. يؤدي التبديل من `openai/gpt-5.5` إلى `openai/gpt-5.2` إلى إبقاء
ربط السلسلة لكنه يطلب من Codex المتابعة باستخدام النموذج المحدد حديثًا.

## أمر Codex

تسجل Plugin المجمّعة الأمر `/codex` كأمر شرطة مائلة مصرّح به. وهو
عام ويعمل على أي قناة تدعم أوامر OpenClaw النصية.

الصيغ الشائعة:

- يعرض `/codex status` حالة الاتصال الحية بـ app-server، والنماذج، والحساب، وحدود المعدل، وخوادم MCP، وSkills.
- يعرض `/codex models` نماذج Codex app-server الحية.
- يعرض `/codex threads [filter]` سلاسل Codex الحديثة.
- يربط `/codex resume <thread-id>` جلسة OpenClaw الحالية بسلسلة Codex موجودة.
- يطلب `/codex compact` من Codex app-server إجراء Compaction للسلسلة المرتبطة.
- يبدأ `/codex review` مراجعة Codex الأصلية للسلسلة المرتبطة.
- يعرض `/codex account` حالة الحساب وحدود المعدل.
- يعرض `/codex mcp` حالة خوادم MCP في Codex app-server.
- يعرض `/codex skills` Skills الخاصة بـ Codex app-server.

يقوم `/codex resume` بكتابة ملف الربط الجانبي نفسه الذي تستخدمه harness في
الأدوار العادية. وفي الرسالة التالية، يستأنف OpenClaw سلسلة Codex تلك، ويمرر
نموذج OpenClaw المحدد حاليًا إلى app-server، ويُبقي السجل الممتد
مفعّلًا.

يتطلب سطح الأوامر هذا Codex app-server ‏`0.118.0` أو أحدث. ويتم الإبلاغ عن
طرق التحكم الفردية على أنها `unsupported by this Codex app-server` إذا كانت
app-server مستقبلية أو مخصصة لا تعرض طريقة JSON-RPC تلك.

## حدود Hook

تحتوي Codex harness على ثلاث طبقات من hooks:

| الطبقة | المالك | الغرض |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| hooks الخاصة بـ OpenClaw Plugin | OpenClaw | توافق المنتج/Plugin عبر كل من PI وCodex harnesses. |
| البرمجيات الوسيطة لامتداد Codex app-server | Plugins المجمعة في OpenClaw | سلوك التكييف لكل دور حول أدوات OpenClaw الديناميكية. |
| hooks الأصلية لـ Codex | Codex | دورة حياة Codex منخفضة المستوى وسياسة الأدوات الأصلية من إعداد Codex. |

لا يستخدم OpenClaw ملفات `hooks.json` الخاصة بـ Codex على مستوى المشروع أو المستوى العام
لتوجيه سلوك OpenClaw Plugin. وتكون hooks الأصلية لـ Codex مفيدة في
العمليات المملوكة لـ Codex مثل سياسة shell، ومراجعة نتائج الأدوات الأصلية، ومعالجة التوقف،
ودورة حياة Compaction/النموذج الأصلية، لكنها ليست واجهة Plugin API الخاصة بـ OpenClaw.

بالنسبة إلى أدوات OpenClaw الديناميكية، ينفذ OpenClaw الأداة بعد أن يطلب Codex
الاستدعاء، لذلك يشغّل OpenClaw سلوك Plugin والبرمجيات الوسيطة التي يملكها في
مكيّف harness. أما بالنسبة إلى الأدوات الأصلية لـ Codex، فإن Codex يملك السجل المرجعي للأداة.
يمكن لـ OpenClaw عكس أحداث محددة، لكنه لا يستطيع إعادة كتابة سلسلة Codex
الأصلية ما لم يعرض Codex تلك العملية عبر app-server أو عبر استدعاءات
hooks الأصلية.

عندما تعرض إصدارات Codex app-server الأحدث أحداث hooks أصلية خاصة بـ Compaction ودورة حياة النموذج،
ينبغي لـ OpenClaw أن يقيّد دعم هذا البروتوكول بحسب الإصدار وأن يربط
الأحداث بعقد hooks الحالي في OpenClaw عندما تكون الدلالة صادقة.
وإلى أن يحدث ذلك، فإن أحداث `before_compaction` و`after_compaction` و`llm_input` و
`llm_output` الخاصة بـ OpenClaw هي ملاحظات على مستوى المكيّف، وليست لقطات بايتية
مطابقة لحمولات الطلب أو Compaction الداخلية في Codex.

تُسقَط إشعارات app-server الأصلية من Codex من نوع `hook/started` و`hook/completed` على شكل
أحداث وكيل `codex_app_server.hook` من أجل التتبّع والتصحيح.
وهي لا تستدعي hooks الخاصة بـ OpenClaw Plugin.

## الأدوات والوسائط وCompaction

تغيّر Codex harness المنفّذ المضمّن منخفض المستوى للوكيل فقط.

ولا يزال OpenClaw يبني قائمة الأدوات ويتلقى نتائج الأدوات الديناميكية من
harness. ويستمر النص، والصور، والفيديو، والموسيقى، وTTS، والموافقات، ومخرجات أدوات المراسلة
عبر مسار التسليم العادي في OpenClaw.

يتم توجيه طلبات موافقة أداة MCP في Codex عبر تدفق الموافقة الخاص بـ OpenClaw
عندما تضع Codex العلامة `_meta.codex_approval_kind` على
`"mcp_tool_call"`. وتُرسل مطالبات Codex ‏`request_user_input`` إلى الدردشة الأصلية،
وتجيب رسالة المتابعة التالية الموضوعة في الطابور على طلب الخادم الأصلي ذاك بدلًا من توجيهها كسياق إضافي. أما طلبات الاستجلاب MCP الأخرى فلا تزال تفشل بشكل مغلق.

عندما يستخدم النموذج المحدد Codex harness، يتم تفويض Compaction الأصلية للسلسلة إلى Codex app-server. ويحافظ OpenClaw على مرآة نصية من أجل سجل القناة، والبحث، و`/new`، و`/reset`، وتبديل النموذج أو harness في المستقبل. وتتضمن
المرآة مطالبة المستخدم، والنص النهائي للمساعد، وسجلات reasoning أو الخطة الخفيفة الخاصة بـ Codex
عندما تصدرها app-server. ويسجّل OpenClaw اليوم فقط إشارات بدء Compaction الأصلية واكتمالها. وهو لا يعرض بعد
ملخصًا مقروءًا للبشر عن Compaction أو قائمة قابلة للتدقيق بالإدخالات التي احتفظ بها Codex بعد Compaction.

ولأن Codex تملك السلسلة الأصلية المرجعية، فإن `tool_result_persist` لا
تعيد حاليًا كتابة سجلات نتائج الأدوات الأصلية لـ Codex. وهي لا تنطبق إلا عندما
يكتب OpenClaw نتيجة أداة في نص جلسة مملوك لـ OpenClaw.

لا يتطلب توليد الوسائط وجود PI. إذ يستمر توليد الصور، والفيديو، والموسيقى، وPDF، وTTS، و
فهم الوسائط في استخدام إعدادات المزوّد/النموذج المطابقة مثل
`agents.defaults.imageGenerationModel`، و`videoGenerationModel`، و`pdfModel`، و
`messages.tts`.

## استكشاف الأخطاء وإصلاحها

**لا يظهر Codex في `/model`:** فعّل `plugins.entries.codex.enabled`،
واختر نموذج `openai/gpt-*` مع `embeddedHarness.runtime: "codex"` (أو
مرجعًا قديمًا `codex/*`)، وتحقق مما إذا كانت `plugins.allow` تستبعد `codex`.

**يستخدم OpenClaw ‏PI بدلًا من Codex:** إذا لم تطالب أي Codex harness بالتشغيل،
فقد يستخدم OpenClaw ‏PI كواجهة خلفية توافقية. اضبط
`embeddedHarness.runtime: "codex"` لفرض اختيار Codex أثناء الاختبار، أو
`embeddedHarness.fallback: "none"` للفشل عندما لا يطابق أي Plugin harness. بمجرد
اختيار Codex app-server، تظهر إخفاقاتها مباشرة من دون إعداد إضافي
للرجوع الاحتياطي.

**يتم رفض app-server:** قم بترقية Codex بحيث تُبلغ مصافحة app-server
عن الإصدار `0.118.0` أو أحدث.

**اكتشاف النموذج بطيء:** خفّض `plugins.entries.codex.config.discovery.timeoutMs`
أو عطّل الاكتشاف.

**يفشل نقل WebSocket مباشرة:** تحقق من `appServer.url`، و`authToken`،
ومن أن app-server البعيدة تتحدث الإصدار نفسه من بروتوكول Codex app-server.

**يستخدم نموذج غير تابع لـ Codex ‏PI:** هذا متوقع ما لم تكن قد فرضت
`embeddedHarness.runtime: "codex"` (أو اخترت مرجعًا قديمًا `codex/*`). تبقى مراجع
`openai/gpt-*` العادية ومراجع المزوّدين الآخرين على مسار المزوّد الطبيعي الخاص بها.

## ذو صلة

- [إضافات Agent Harness](/ar/plugins/sdk-agent-harness)
- [مزوّدو النماذج](/ar/concepts/model-providers)
- [مرجع الإعداد](/ar/gateway/configuration-reference)
- [الاختبار](/ar/help/testing-live#live-codex-app-server-harness-smoke)
