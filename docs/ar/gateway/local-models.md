---
read_when:
    - تريد استضافة النماذج على جهاز GPU الخاص بك
    - أنت توصل LM Studio أو وكيلاً متوافقاً مع OpenAI
    - تحتاج إلى إرشادات النموذج المحلي الأكثر أمانًا
summary: شغّل OpenClaw على نماذج LLM محلية (LM Studio، وvLLM، وLiteLLM، ونقاط نهاية OpenAI مخصصة)
title: النماذج المحلية
x-i18n:
    generated_at: "2026-06-27T17:39:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 671c92d78fa29c778fd34b6df027cc8f9e7ad507c9d446700d97cd789becd041
    source_path: gateway/local-models.md
    workflow: 16
---

النماذج المحلية ممكنة. لكنها ترفع أيضًا متطلبات العتاد، وحجم السياق، والدفاع ضد حقن التعليمات — فالبطاقات الصغيرة أو المضغوطة كميًا بقوة تقطع السياق وتضعف السلامة. هذه الصفحة دليل موجّه للبُنى المحلية الأعلى قدرة والخوادم المحلية المخصصة المتوافقة مع OpenAI. لأقل مسار إعداد احتكاكًا، ابدأ بـ [LM Studio](/ar/providers/lmstudio) أو [Ollama](/ar/providers/ollama) و`openclaw onboard`.

بالنسبة إلى الخوادم المحلية التي يجب أن تبدأ فقط عندما يحتاج إليها نموذج محدد، راجع
[خدمات النماذج المحلية](/ar/gateway/local-model-services).

## الحد الأدنى للعتاد

استهدف مستوى عاليًا: **≥2 جهاز Mac Studio بأقصى المواصفات أو منصة GPU مكافئة (~$30k+)** للحصول على حلقة وكيل مريحة. تعمل وحدة GPU واحدة بسعة **24 GB** فقط مع التعليمات الأخف وبزمن استجابة أعلى. شغّل دائمًا **أكبر متغير / المتغير كامل الحجم يمكنك استضافته**؛ فالنقاط المرجعية الصغيرة أو المضغوطة كميًا بشدة ترفع خطر حقن التعليمات (راجع [الأمان](/ar/gateway/security)).

## اختر خلفية تشغيل

| خلفية التشغيل                                       | استخدمها عندما                                                               |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [ds4](/ar/providers/ds4)                                | DeepSeek V4 Flash محلي على macOS Metal مع استدعاءات أدوات متوافقة مع OpenAI |
| [LM Studio](/ar/providers/lmstudio)                     | إعداد محلي لأول مرة، محمّل بواجهة رسومية، Responses API أصلية               |
| LiteLLM / OAI-proxy / وكيل مخصص متوافق مع OpenAI | تواجه واجهة API لنموذج آخر وتحتاج أن يتعامل OpenClaw معها كأنها OpenAI      |
| MLX / vLLM / SGLang                                  | تقديم مستضاف ذاتيًا عالي الإنتاجية مع نقطة نهاية HTTP متوافقة مع OpenAI     |
| [Ollama](/ar/providers/ollama)                          | سير عمل CLI، مكتبة نماذج، خدمة systemd بلا تدخل                             |

استخدم Responses API (`api: "openai-responses"`) عندما تدعمه خلفية التشغيل (LM Studio يدعمه). وإلا فالتزم بـ Chat Completions (`api: "openai-completions"`).

<Warning>
**مستخدمو WSL2 + Ollama + NVIDIA/CUDA:** يفعّل مثبّت Ollama الرسمي على Linux خدمة systemd مع `Restart=always`. في إعدادات WSL2 GPU، قد يعيد التشغيل التلقائي تحميل آخر نموذج أثناء الإقلاع ويثبّت ذاكرة المضيف. إذا كانت آلة WSL2 الافتراضية لديك تعيد التشغيل مرارًا بعد تفعيل Ollama، فراجع [حلقة تعطل WSL2](/ar/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## موصى به: LM Studio + نموذج محلي كبير (Responses API)

أفضل بنية محلية حاليًا. حمّل نموذجًا كبيرًا في LM Studio (مثلًا، بناء Qwen أو DeepSeek أو Llama كامل الحجم)، وفعّل الخادم المحلي (الافتراضي `http://127.0.0.1:1234`)، واستخدم Responses API لإبقاء الاستدلال منفصلًا عن النص النهائي.

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "lmstudio/my-local-model": { alias: "Local" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

**قائمة تحقق الإعداد**

- ثبّت LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- في LM Studio، نزّل **أكبر بناء نموذج متاح** (تجنب المتغيرات "الصغيرة"/المضغوطة كميًا بشدة)، وابدأ الخادم، وتأكد أن `http://127.0.0.1:1234/v1/models` يعرضه.
- استبدل `my-local-model` بمعرّف النموذج الفعلي المعروض في LM Studio.
- أبقِ النموذج محمّلًا؛ فالتحميل البارد يضيف زمن بدء.
- عدّل `contextWindow`/`maxTokens` إذا كان بناء LM Studio لديك مختلفًا.
- بالنسبة إلى WhatsApp، التزم بـ Responses API بحيث يُرسل النص النهائي فقط.

أبقِ النماذج المستضافة مهيأة حتى عند التشغيل محليًا؛ استخدم `models.mode: "merge"` لكي تبقى مسارات الرجوع متاحة.

### تهيئة هجينة: نموذج مستضاف أساسي، ونموذج محلي كمسار رجوع

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["lmstudio/my-local-model", "anthropic/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "lmstudio/my-local-model": { alias: "Local" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### المحلي أولًا مع شبكة أمان مستضافة

بدّل ترتيب النموذج الأساسي ومسار الرجوع؛ أبقِ كتلة المزوّدين نفسها و`models.mode: "merge"` لكي تتمكن من الرجوع إلى Sonnet أو Opus عندما يكون الجهاز المحلي متوقفًا.

### الاستضافة الإقليمية / توجيه البيانات

- توجد أيضًا متغيرات MiniMax/Kimi/GLM مستضافة على OpenRouter مع نقاط نهاية مثبتة إقليميًا (مثلًا، مستضافة في الولايات المتحدة). اختر المتغير الإقليمي هناك لإبقاء حركة المرور ضمن الولاية القضائية التي تختارها مع الاستمرار في استخدام `models.mode: "merge"` لمسارات الرجوع إلى Anthropic/OpenAI.
- يبقى المسار المحلي فقط أقوى مسار للخصوصية؛ أما التوجيه الإقليمي المستضاف فهو الحل الوسط عندما تحتاج إلى ميزات المزوّد لكن تريد التحكم في تدفق البيانات.

## وكلاء محليون آخرون متوافقون مع OpenAI

تعمل MLX (`mlx_lm.server`) وvLLM وSGLang وLiteLLM وOAI-proxy أو Gateway مخصص
إذا كانت تكشف نقطة نهاية بأسلوب OpenAI مثل `/v1/chat/completions`.
استخدم محوّل Chat Completions ما لم توثق خلفية التشغيل صراحة دعم
`/v1/responses`. استبدل كتلة المزوّد أعلاه بنقطة النهاية ومعرّف النموذج لديك:

```json5
{
  agents: {
    defaults: {
      model: { primary: "local/my-local-model" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 120000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

إذا حُذف `api` في مزوّد مخصص لديه `baseUrl`، يستخدم OpenClaw افتراضيًا
`openai-completions`. تثق إدخالات المزوّدين المخصصين/المحليين في أصل
`baseUrl` المضبوط بدقة لطلبات النماذج المحروسة، بما في ذلك loopback وLAN وtailnet
ومضيفو DNS الخاص. لا تزال الطلبات إلى أصول خاصة أخرى تحتاج إلى
`request.allowPrivateNetwork: true`؛ وتبقى أصول metadata/link-local محظورة
دون قبول صريح. اضبطه على `false` لإلغاء الثقة بالأصل الدقيق.

قيمة `models.providers.<id>.models[].id` محلية للمزوّد. لا
تدرج بادئة المزوّد هناك. على سبيل المثال، يجب أن يستخدم خادم MLX بدأ بـ
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` معرّف
الفهرس ومرجع النموذج التاليين:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

اضبط `input: ["text", "image"]` على نماذج الرؤية المحلية أو الممررة عبر وكيل لكي
تُحقن مرفقات الصور في أدوار الوكيل. يستنتج إعداد المزوّد المخصص التفاعلي
معرّفات نماذج الرؤية الشائعة ولا يسأل إلا عن الأسماء غير المعروفة.
يستخدم الإعداد غير التفاعلي الاستنتاج نفسه؛ استخدم `--custom-image-input`
لمعرّفات الرؤية غير المعروفة أو `--custom-text-input` عندما يكون نموذج يبدو معروفًا
نصيًا فقط خلف نقطة النهاية لديك.

أبقِ `models.mode: "merge"` لكي تبقى النماذج المستضافة متاحة كمسارات رجوع.
استخدم `models.providers.<id>.timeoutSeconds` لخوادم النماذج المحلية أو البعيدة
البطيئة قبل رفع `agents.defaults.timeoutSeconds`. تنطبق مهلة المزوّد
فقط على طلبات HTTP الخاصة بالنموذج، بما في ذلك الاتصال، والترويسات، وتدفق الجسم،
وإلغاء الجلب المحروس الإجمالي. إذا كانت مهلة الوكيل أو التشغيل أقل، فارفع
ذلك السقف أيضًا لأن مهل المزوّد لا يمكنها تمديد تشغيل الوكيل كله.

<Note>
بالنسبة إلى المزوّدين المخصصين المتوافقين مع OpenAI، يُقبل حفظ علامة محلية غير سرية مثل `apiKey: "ollama-local"` عندما يتحول `baseUrl` إلى loopback أو LAN خاصة أو `.local` أو اسم مضيف مجرد. يعامله OpenClaw كاعتماد محلي صالح بدلًا من الإبلاغ عن مفتاح مفقود. استخدم قيمة حقيقية لأي مزوّد يقبل اسم مضيف عامًا.
</Note>

ملاحظة سلوكية لخلفيات `/v1` المحلية/الممررة عبر وكيل:

- يتعامل OpenClaw معها كمسارات متوافقة مع OpenAI بأسلوب الوكيل، لا كنقاط نهاية
  OpenAI أصلية
- لا ينطبق تشكيل الطلبات الخاص بـ OpenAI الأصلية هنا: لا
  `service_tier`، ولا Responses `store`، ولا تشكيل حمولة توافق الاستدلال في OpenAI،
  ولا تلميحات ذاكرة التخزين المؤقت للتعليمات
- لا تُحقن ترويسات إسناد OpenClaw المخفية (`originator` و`version` و`User-Agent`)
  على عناوين URL الخاصة بالوكيل المخصص هذه

ملاحظات توافق لخلفيات التشغيل المتوافقة مع OpenAI الأكثر صرامة:

- تقبل بعض الخوادم `messages[].content` كسلسلة نصية فقط في Chat Completions، وليس
  مصفوفات أجزاء محتوى منظّمة. اضبط
  `models.providers.<provider>.models[].compat.requiresStringContent: true` لتلك
  النقاط النهائية.
- تصدر بعض النماذج المحلية طلبات أدوات مستقلة بين أقواس كنص، مثل
  `[tool_name]` متبوعًا بـ JSON و`[END_TOOL_REQUEST]`. يرفع OpenClaw
  هذه الطلبات إلى استدعاءات أدوات حقيقية فقط عندما يطابق الاسم تمامًا أداة مسجلة
  لذلك الدور؛ وإلا تُعامل الكتلة كنص غير مدعوم وتُخفى عن الردود
  المرئية للمستخدم.
- إذا أصدر نموذج JSON أو XML أو نصًا بأسلوب ReAct يبدو كاستدعاء أداة
  لكن المزوّد لم يصدر استدعاءً منظّمًا، يتركه OpenClaw كنص
  ويسجل تحذيرًا مع معرّف التشغيل، والمزوّد/النموذج، والنمط المكتشف، واسم
  الأداة عند توفره. تعامل مع ذلك كعدم توافق في استدعاءات الأدوات لدى المزوّد/النموذج،
  لا كتشغيل أداة مكتمل.
- إذا ظهرت الأدوات كنص من المساعد بدلًا من تشغيلها، مثل JSON خام،
  أو XML، أو صياغة ReAct، أو مصفوفة `tool_calls` فارغة في استجابة المزوّد،
  فتحقق أولًا من أن الخادم يستخدم قالب/محلل دردشة قادرًا على استدعاء الأدوات. بالنسبة إلى
  خلفيات Chat Completions المتوافقة مع OpenAI التي لا يعمل محللها إلا عند فرض
  استخدام الأدوات، اضبط تجاوز طلب لكل نموذج بدلًا من الاعتماد على تحليل النص:

  ```json5
  {
    agents: {
      defaults: {
        models: {
          "local/my-local-model": {
            params: {
              extra_body: {
                tool_choice: "required",
              },
            },
          },
        },
      },
    },
  }
  ```

  استخدم هذا فقط للنماذج/الجلسات التي يجب أن يستدعي فيها كل دور عادي أداة.
  إنه يتجاوز قيمة الوكيل الافتراضية في OpenClaw وهي `tool_choice: "auto"`.
  استبدل `local/my-local-model` بمرجع المزوّد/النموذج الدقيق المعروض بواسطة
  `openclaw models list`.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- إذا كان نموذج مخصص متوافق مع OpenAI يقبل جهود استدلال OpenAI تتجاوز
  الملف الشخصي المدمج، فصرّح بها في كتلة توافق النموذج. إضافة `"xhigh"`
  هنا تجعل `/think xhigh`، ومحددات الجلسة، والتحقق في Gateway، والتحقق في `llm-task`
  تعرض المستوى لمرجع المزوّد/النموذج المهيأ ذلك:

  ```json5
  {
    models: {
      providers: {
        local: {
          baseUrl: "http://127.0.0.1:8000/v1",
          apiKey: "sk-local",
          api: "openai-responses",
          models: [
            {
              id: "gpt-5.4",
              name: "GPT 5.4 via local proxy",
              reasoning: true,
              input: ["text"],
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
              contextWindow: 196608,
              maxTokens: 8192,
              compat: {
                supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
                reasoningEffortMap: { xhigh: "xhigh" },
              },
            },
          ],
        },
      },
    },
  }
  ```

## واجهات خلفية أصغر أو أكثر صرامة

إذا حُمّل النموذج بنجاح لكن جولات الوكيل الكاملة لا تعمل كما ينبغي، فاعمل من الأعلى إلى الأسفل — أكّد النقل أولًا، ثم ضيّق السطح.

1. **تأكد من أن النموذج المحلي نفسه يستجيب.** بلا أدوات، ولا سياق وكيل:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **تأكد من توجيه Gateway.** يرسل الموجه المقدم فقط — ويتجاوز النصّ، وتمهيد AGENTS، وتجميع محرك السياق، والأدوات، وخوادم MCP المضمّنة، لكنه يظل يختبر توجيه Gateway والمصادقة واختيار المزوّد:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **جرّب الوضع الخفيف.** إذا نجح الفحصان لكن جولات الوكيل الحقيقية تفشل بسبب استدعاءات أدوات مشوّهة أو موجّهات زائدة الحجم، ففعّل `agents.defaults.experimental.localModelLean: true`. يحذف هذا أثقل ثلاث أدوات افتراضية (`browser` و`cron` و`message`) ويضع كتالوجات الأدوات الأكبر افتراضيًا خلف عناصر تحكم منظّمة للبحث عن الأدوات، باستثناء التشغيلات التي يجب أن تحتفظ بدلالات تسليم `message` المباشر. راجع [الميزات التجريبية ← الوضع الخفيف للنموذج المحلي](/ar/concepts/experimental-features#local-model-lean-mode) للاطلاع على الشرح الكامل، ومتى تستخدمه، وكيفية التأكد من أنه مفعّل.

4. **عطّل الأدوات بالكامل كحل أخير.** إذا لم يكن الوضع الخفيف كافيًا، فاضبط `models.providers.<provider>.models[].compat.supportsTools: false` لإدخال ذلك النموذج. سيعمل الوكيل حينها من دون استدعاءات أدوات على ذلك النموذج.

5. **بعد ذلك، تكون نقطة الاختناق في المنبع.** إذا ظلت الواجهة الخلفية تفشل فقط في تشغيلات OpenClaw الأكبر بعد الوضع الخفيف و`supportsTools: false`، فالمشكلة المتبقية تكون عادة في النموذج أو سعة الخادم في المنبع — نافذة السياق، أو ذاكرة GPU، أو إخلاء kv-cache، أو علة في الواجهة الخلفية. عند تلك المرحلة، ليست المشكلة في طبقة النقل الخاصة بـ OpenClaw.

## استكشاف الأخطاء وإصلاحها

- هل يستطيع Gateway الوصول إلى الوكيل؟ `curl http://127.0.0.1:1234/v1/models`.
- هل نموذج LM Studio غير محمّل؟ أعد تحميله؛ فبدء التشغيل البارد سبب شائع لحالات "التعليق".
- هل يقول الخادم المحلي `terminated` أو `ECONNRESET`، أو يغلق الدفق في منتصف الجولة؟
  يسجّل OpenClaw قيمة منخفضة التنوّع لـ `model.call.error.failureKind` إضافة إلى
  لقطة RSS/heap لعملية OpenClaw في التشخيصات. في حالات ضغط الذاكرة مع LM Studio/Ollama،
  طابق ذلك الطابع الزمني مع سجل الخادم أو سجل تعطل macOS /
  سجل jetsam لتأكيد ما إذا كان خادم النموذج قد أُنهي.
- يستنتج OpenClaw عتبات الفحص المسبق لنافذة السياق من نافذة النموذج المكتشفة، أو من نافذة النموذج غير المحددة عندما يخفض `agents.defaults.contextTokens` النافذة الفعالة. يحذر تحت 20% بحد أدنى **8k**. تستخدم عمليات الحظر الصارمة عتبة 10% بحد أدنى **4k**، مع حد أقصى يساوي نافذة السياق الفعالة حتى لا تتمكن بيانات النموذج الوصفية الزائدة الحجم من رفض حد مستخدم صالح بخلاف ذلك. إذا وصلت إلى ذلك الفحص المسبق، فارفع حد سياق الخادم/النموذج أو اختر نموذجًا أكبر.
- هل توجد أخطاء سياق؟ خفّض `contextWindow` أو ارفع حد الخادم لديك.
- هل يعيد خادم متوافق مع OpenAI الخطأ `messages[].content ... expected a string`؟
  أضف `compat.requiresStringContent: true` إلى إدخال ذلك النموذج.
- هل يعيد خادم متوافق مع OpenAI الخطأ `validation.keys` أو يقول إن إدخالات الرسائل لا تسمح إلا بـ `role` و`content`؟
  أضف `compat.strictMessageKeys: true` إلى إدخال ذلك النموذج.
- هل تعمل استدعاءات `/v1/chat/completions` الصغيرة المباشرة، لكن `openclaw infer model run --local`
  يفشل على Gemma أو نموذج محلي آخر؟ تحقق أولًا من عنوان URL للمزوّد، ومرجع النموذج، وعلامة المصادقة،
  وسجلات الخادم؛ لا يتضمن `model run` المحلي أدوات الوكيل.
  إذا نجح `model run` المحلي لكن جولات الوكيل الأكبر فشلت، فقلّل سطح أدوات الوكيل باستخدام
  `localModelLean` أو `compat.supportsTools: false`.
- هل تظهر استدعاءات الأدوات كنص JSON/XML/ReAct خام، أو يعيد المزوّد
  مصفوفة `tool_calls` فارغة؟ لا تضف وكيلًا يحوّل نص المساعد
  عشوائيًا إلى تنفيذ أدوات. أصلح قالب/محلل دردشة الخادم أولًا. إذا كان
  النموذج لا يعمل إلا عند فرض استخدام الأدوات، فأضف تجاوز
  `params.extra_body.tool_choice: "required"` لكل نموذج أعلاه، واستخدم إدخال ذلك النموذج
  فقط للجلسات التي يُتوقع فيها استدعاء أداة في كل جولة.
- السلامة: تتجاوز النماذج المحلية مرشحات جانب المزوّد؛ أبقِ الوكلاء ضيّقي النطاق وCompaction مفعّلًا للحد من نطاق تأثير حقن الموجّه.

## ذو صلة

- [مرجع الإعدادات](/ar/gateway/configuration-reference)
- [تجاوز فشل النموذج](/ar/concepts/model-failover)
