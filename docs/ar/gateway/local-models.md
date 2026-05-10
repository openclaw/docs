---
read_when:
    - تريد استضافة النماذج من جهازك الخاص المزود بوحدة GPU
    - أنت تُهيّئ LM Studio أو وكيلاً متوافقاً مع OpenAI
    - تحتاج إلى إرشادات النموذج المحلي الأكثر أمانًا
summary: شغّل OpenClaw على نماذج LLM المحلية (LM Studio، vLLM، LiteLLM، نقاط نهاية OpenAI المخصصة)
title: النماذج المحلية
x-i18n:
    generated_at: "2026-05-10T19:41:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83a5667aa5bef697a890b0d8b6b8f5e4de56fa3cdcdfe5a5dbb826a62b64fbcf
    source_path: gateway/local-models.md
    workflow: 16
---

النماذج المحلية ممكنة. لكنها ترفع أيضًا متطلبات العتاد، وحجم السياق، والدفاع ضد حقن المطالبات — فالبطاقات الصغيرة أو المكمّمة بشدة تقطع السياق وتسرّب الأمان. هذه الصفحة هي الدليل الموجّه للمنظومات المحلية الأعلى قدرة وخوادم OpenAI-compatible المحلية المخصصة. للحصول على تهيئة أولية بأقل احتكاك، ابدأ بـ [LM Studio](/ar/providers/lmstudio) أو [Ollama](/ar/providers/ollama) و`openclaw onboard`.

بالنسبة إلى الخوادم المحلية التي يجب أن تبدأ فقط عندما يحتاج إليها نموذج محدد، راجع
[خدمات النماذج المحلية](/ar/gateway/local-model-services).

## الحد الأدنى للعتاد

استهدف مستوى عاليًا: **جهازي Mac Studio مكتملَي المواصفات على الأقل أو منصة GPU مكافئة (~$30k+)** للحصول على حلقة وكيل مريحة. تعمل وحدة GPU واحدة بسعة **24 GB** فقط مع المطالبات الأخف وبزمن استجابة أعلى. شغّل دائمًا **أكبر متغير / المتغير كامل الحجم يمكنك استضافته**؛ إذ إن نقاط التحقق الصغيرة أو المكمّمة بشدة تزيد خطر حقن المطالبات (راجع [الأمان](/ar/gateway/security)).

## اختر خلفية تشغيل

| خلفية التشغيل                                        | استخدمها عندما                                                               |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [LM Studio](/ar/providers/lmstudio)                     | إعداد محلي لأول مرة، محمّل GUI، Responses API أصلية                        |
| [Ollama](/ar/providers/ollama)                          | سير عمل CLI، مكتبة نماذج، خدمة systemd بلا تدخل                            |
| MLX / vLLM / SGLang                                  | تقديم مستضاف ذاتيًا عالي الإنتاجية مع نقطة نهاية HTTP متوافقة مع OpenAI    |
| LiteLLM / OAI-proxy / وكيل OpenAI-compatible مخصص    | تضع واجهة أمام API نموذج آخر وتحتاج أن يتعامل OpenClaw معه كأنه OpenAI     |

استخدم Responses API (`api: "openai-responses"`) عندما تدعمه خلفية التشغيل (يدعمه LM Studio). بخلاف ذلك التزم بـ Chat Completions (`api: "openai-completions"`).

<Warning>
**مستخدمو WSL2 + Ollama + NVIDIA/CUDA:** يفعّل مثبت Ollama الرسمي على Linux خدمة systemd مع `Restart=always`. في إعدادات WSL2 GPU، يمكن للتشغيل التلقائي إعادة تحميل آخر نموذج أثناء الإقلاع وتثبيت ذاكرة المضيف. إذا كان جهاز WSL2 VM لديك يعيد التشغيل مرارًا بعد تفعيل Ollama، فراجع [حلقة تعطل WSL2](/ar/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## الموصى به: LM Studio + نموذج محلي كبير (Responses API)

أفضل منظومة محلية حاليًا. حمّل نموذجًا كبيرًا في LM Studio (مثل بناء Qwen أو DeepSeek أو Llama كامل الحجم)، وفعّل الخادم المحلي (الافتراضي `http://127.0.0.1:1234`)، واستخدم Responses API لإبقاء الاستدلال منفصلًا عن النص النهائي.

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
- في LM Studio، نزّل **أكبر بناء نموذج متاح** (تجنب المتغيرات "الصغيرة"/المكمّمة بشدة)، وابدأ الخادم، وتأكد من أن `http://127.0.0.1:1234/v1/models` يعرضه.
- استبدل `my-local-model` بمعرّف النموذج الفعلي الظاهر في LM Studio.
- أبقِ النموذج محمّلًا؛ فالتحميل البارد يضيف زمن بدء.
- عدّل `contextWindow`/`maxTokens` إذا كان بناء LM Studio لديك مختلفًا.
- بالنسبة إلى WhatsApp، التزم بـ Responses API حتى يُرسل النص النهائي فقط.

أبقِ النماذج المستضافة مهيأة حتى عند التشغيل المحلي؛ استخدم `models.mode: "merge"` حتى تظل مسارات الرجوع متاحة.

### تهيئة هجينة: أساسي مستضاف، ورجوع محلي

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

### محلي أولًا مع شبكة أمان مستضافة

بدّل ترتيب الأساسي ومسار الرجوع؛ أبقِ كتلة المزوّدين نفسها و`models.mode: "merge"` حتى تتمكن من الرجوع إلى Sonnet أو Opus عندما يكون الجهاز المحلي متوقفًا.

### الاستضافة الإقليمية / توجيه البيانات

- توجد أيضًا متغيرات MiniMax/Kimi/GLM المستضافة على OpenRouter مع نقاط نهاية مثبّتة إقليميًا (مثلًا، مستضافة في الولايات المتحدة). اختر المتغير الإقليمي هناك لإبقاء حركة البيانات ضمن الولاية القضائية التي تختارها مع الاستمرار في استخدام `models.mode: "merge"` لمسارات الرجوع إلى Anthropic/OpenAI.
- يبقى المسار المحلي فقط هو أقوى مسار للخصوصية؛ أما التوجيه الإقليمي المستضاف فهو حل وسط عندما تحتاج ميزات المزوّد مع رغبتك في التحكم بتدفق البيانات.

## وكلاء محليون آخرون متوافقون مع OpenAI

تعمل MLX (`mlx_lm.server`) وvLLM وSGLang وLiteLLM وOAI-proxy أو
البوابات المخصصة إذا كانت تعرض نقطة نهاية `/v1/chat/completions`
بنمط OpenAI. استخدم محوّل Chat Completions ما لم توثق خلفية التشغيل صراحة
دعم `/v1/responses`. استبدل كتلة المزوّد أعلاه بنقطة النهاية ومعرّف النموذج
لديك:

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

إذا حُذف `api` على مزوّد مخصص لديه `baseUrl`، يستخدم OpenClaw افتراضيًا
`openai-completions`. نقاط نهاية local loopback مثل `127.0.0.1` موثوقة
تلقائيًا؛ أما نقاط نهاية LAN وtailnet وDNS الخاصة فما زالت تحتاج إلى
`request.allowPrivateNetwork: true`.

قيمة `models.providers.<id>.models[].id` محلية ضمن المزوّد. لا
تضمّن بادئة المزوّد هناك. على سبيل المثال، يجب أن يستخدم خادم MLX بدأ بـ
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` معرّف الفهرس ومرجع النموذج
التاليين:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

اضبط `input: ["text", "image"]` على نماذج الرؤية المحلية أو الموكّلة حتى تُحقن
مرفقات الصور في أدوار الوكيل. تستنتج التهيئة الأولية التفاعلية للمزوّد المخصص
معرّفات نماذج الرؤية الشائعة ولا تسأل إلا عن الأسماء غير المعروفة.
تستخدم التهيئة الأولية غير التفاعلية الاستنتاج نفسه؛ استخدم `--custom-image-input`
لمعرّفات الرؤية غير المعروفة أو `--custom-text-input` عندما يكون نموذج يبدو معروفًا
نصيًا فقط خلف نقطة النهاية لديك.

أبقِ `models.mode: "merge"` حتى تظل النماذج المستضافة متاحة كمسارات رجوع.
استخدم `models.providers.<id>.timeoutSeconds` لخوادم النماذج المحلية أو البعيدة
البطيئة قبل رفع `agents.defaults.timeoutSeconds`. ينطبق مهلة المزوّد
فقط على طلبات HTTP الخاصة بالنموذج، بما في ذلك الاتصال، والترويسات، وتدفق الجسم،
والإجهاض الكلي لجلب guarded-fetch.

<Note>
بالنسبة إلى مزوّدي OpenAI-compatible المخصصين، يُقبل حفظ علامة محلية غير سرية مثل `apiKey: "ollama-local"` عندما يُحل `baseUrl` إلى loopback أو LAN خاصة أو `.local` أو اسم مضيف عارٍ. يتعامل OpenClaw معها كاعتماد محلي صالح بدلًا من الإبلاغ عن مفتاح مفقود. استخدم قيمة حقيقية لأي مزوّد يقبل اسم مضيف عام.
</Note>

ملاحظة سلوك لخلفيات `/v1` المحلية/الموكّلة:

- يتعامل OpenClaw معها كمسارات OpenAI-compatible بنمط الوكيل، لا كنقاط نهاية
  OpenAI أصلية
- لا ينطبق تشكيل الطلبات الخاص بـ OpenAI الأصلي هنا: لا
  `service_tier`، ولا Responses `store`، ولا تشكيل حمولة توافق الاستدلال في OpenAI،
  ولا تلميحات تخزين مؤقت للمطالبات
- لا تُحقن ترويسات إسناد OpenClaw المخفية (`originator`، و`version`، و`User-Agent`)
  في عناوين URL المخصصة هذه للوكيل

ملاحظات توافق لخلفيات OpenAI-compatible الأكثر صرامة:

- تقبل بعض الخوادم فقط `messages[].content` كنص في Chat Completions، وليس
  مصفوفات أجزاء محتوى منظمة. اضبط
  `models.providers.<provider>.models[].compat.requiresStringContent: true` لهذه
  النقاط النهائية.
- تصدر بعض النماذج المحلية طلبات أدوات مستقلة بين أقواس كنص، مثل
  `[tool_name]` متبوعة بـ JSON و`[END_TOOL_REQUEST]`. يرقّي OpenClaw
  هذه إلى استدعاءات أدوات حقيقية فقط عندما يطابق الاسم بالضبط أداة مسجلة
  للدور؛ وإلا تُعامل الكتلة كنص غير مدعوم وتُخفى من الردود المرئية للمستخدم.
- إذا أصدر نموذج JSON أو XML أو نصًا بأسلوب ReAct يبدو كاستدعاء أداة
  لكن المزوّد لم يصدر استدعاءً منظمًا، يتركه OpenClaw كنص
  ويسجل تحذيرًا يتضمن معرّف التشغيل، والمزوّد/النموذج، والنمط المكتشف،
  واسم الأداة عند توفره. تعامل مع ذلك كعدم توافق استدعاء أدوات في المزوّد/النموذج،
  وليس كتسلسل أداة مكتمل.
- إذا ظهرت الأدوات كنص من المساعد بدلًا من التشغيل، مثل JSON خام،
  أو XML، أو صياغة ReAct، أو مصفوفة `tool_calls` فارغة في استجابة المزوّد،
  فتحقق أولًا من أن الخادم يستخدم قالب/محلل دردشة قادرًا على استدعاء الأدوات. بالنسبة إلى
  خلفيات Chat Completions المتوافقة مع OpenAI التي يعمل محللها فقط عندما يكون استخدام الأدوات
  مفروضًا، اضبط تجاوز طلب لكل نموذج بدلًا من الاعتماد على تحليل النص:

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
  إنه يتجاوز قيمة الوكيل الافتراضية في OpenClaw لـ `tool_choice: "auto"`.
  استبدل `local/my-local-model` بمرجع المزوّد/النموذج الدقيق الذي يعرضه
  `openclaw models list`.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- إذا كان نموذج OpenAI-compatible مخصص يقبل جهود استدلال OpenAI تتجاوز
  ملف التعريف المضمن، فأعلن عنها في كتلة توافق النموذج. إضافة `"xhigh"`
  هنا تجعل `/think xhigh`، ومحددات الجلسات، والتحقق في Gateway، والتحقق في `llm-task`
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

## خلفيات تشغيل أصغر أو أكثر صرامة

إذا حُمّل النموذج بنجاح لكن دورات الوكيل الكاملة تتصرف بشكل غير صحيح، فاعمل من الأعلى إلى الأسفل — أكّد النقل أولاً، ثم ضيّق النطاق.

1. **تأكد من أن النموذج المحلي نفسه يستجيب.** بلا أدوات، وبلا سياق وكيل:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **تأكد من توجيه Gateway.** يرسل الموجّه المقدّم فقط — ويتخطى النص، وتمهيد AGENTS، وتجميع محرك السياق، والأدوات، وخوادم MCP المضمّنة، لكنه لا يزال يختبر توجيه Gateway، والمصادقة، واختيار المزوّد:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **جرّب الوضع الخفيف.** إذا نجح الفحصان لكن دورات الوكيل الحقيقية تفشل بسبب استدعاءات أدوات مشوّهة أو موجّهات مفرطة الحجم، ففعّل `agents.defaults.experimental.localModelLean: true`. يحذف أثقل ثلاث أدوات افتراضية (`browser`, `cron`, `message`) بحيث يصبح شكل الموجّه أصغر وأقل هشاشة. راجع [الميزات التجريبية → وضع النموذج المحلي الخفيف](/ar/concepts/experimental-features#local-model-lean-mode) للاطلاع على الشرح الكامل، ومتى تستخدمه، وكيف تؤكد أنه مفعّل.

4. **عطّل الأدوات بالكامل كحل أخير.** إذا لم يكن الوضع الخفيف كافياً، فاضبط `models.providers.<provider>.models[].compat.supportsTools: false` لإدخال ذلك النموذج. عندها سيعمل الوكيل دون استدعاءات أدوات على ذلك النموذج.

5. **بعد ذلك، يكون عنق الزجاجة في المنبع.** إذا استمرت الواجهة الخلفية في الفشل فقط في تشغيلات OpenClaw الأكبر بعد الوضع الخفيف و `supportsTools: false`، فغالباً ما تكون المشكلة المتبقية في النموذج أو سعة الخادم في المنبع — نافذة السياق، أو ذاكرة GPU، أو إخلاء kv-cache، أو خلل في الواجهة الخلفية. عند تلك النقطة، لا تكون المشكلة في طبقة النقل الخاصة بـ OpenClaw.

## استكشاف الأخطاء وإصلاحها

- هل يستطيع Gateway الوصول إلى الوكيل؟ `curl http://127.0.0.1:1234/v1/models`.
- هل نموذج LM Studio غير محمّل؟ أعد تحميله؛ فالبدء البارد سبب شائع لحالة "التعليق".
- هل يقول الخادم المحلي `terminated` أو `ECONNRESET` أو يغلق الدفق في منتصف الدور؟
  يسجل OpenClaw قيمة منخفضة التنوع `model.call.error.failureKind` بالإضافة إلى
  لقطة RSS/heap لعملية OpenClaw في التشخيصات. بالنسبة إلى ضغط الذاكرة في LM Studio/Ollama،
  طابق ذلك الطابع الزمني مع سجل الخادم أو سجل تعطل macOS /
  سجل jetsam لتأكيد ما إذا كان خادم النموذج قد أُنهي.
- يشتق OpenClaw حدود فحص نافذة السياق المسبق من نافذة النموذج المكتشفة، أو من نافذة النموذج غير المحدودة عندما يخفض `agents.defaults.contextTokens` النافذة الفعالة. يحذّر عند أقل من 20% مع حد أدنى **8k**. تستخدم عمليات الحظر الصارمة عتبة 10% مع حد أدنى **4k**، وتُقيّد بنافذة السياق الفعالة بحيث لا يمكن لبيانات تعريف نموذج مفرطة الحجم رفض سقف مستخدم صالح بخلاف ذلك. إذا واجهت ذلك الفحص المسبق، فارفع حد سياق الخادم/النموذج أو اختر نموذجاً أكبر.
- أخطاء السياق؟ خفّض `contextWindow` أو ارفع حد الخادم لديك.
- هل يعيد خادم متوافق مع OpenAI رسالة `messages[].content ... expected a string`؟
  أضف `compat.requiresStringContent: true` على إدخال ذلك النموذج.
- هل يعيد خادم متوافق مع OpenAI رسالة `validation.keys` أو يقول إن إدخالات الرسائل لا تسمح إلا بـ `role` و `content`؟
  أضف `compat.strictMessageKeys: true` على إدخال ذلك النموذج.
- هل تعمل استدعاءات `/v1/chat/completions` الصغيرة المباشرة، لكن يفشل `openclaw infer model run --local`
  على Gemma أو نموذج محلي آخر؟ افحص عنوان URL للمزوّد، ومرجع النموذج، وعلامة المصادقة،
  وسجلات الخادم أولاً؛ فـ `model run` المحلي لا يتضمن أدوات الوكيل.
  إذا نجح `model run` المحلي لكن فشلت دورات الوكيل الأكبر، فقلّل نطاق أدوات الوكيل
  باستخدام `localModelLean` أو `compat.supportsTools: false`.
- هل تظهر استدعاءات الأدوات كنص JSON/XML/ReAct خام، أو يعيد المزوّد
  مصفوفة `tool_calls` فارغة؟ لا تضف وكيلاً يحوّل نص المساعد عشوائياً
  إلى تنفيذ أدوات. أصلح قالب/محلّل دردشة الخادم أولاً. إذا كان
  النموذج لا يعمل إلا عند فرض استخدام الأدوات، فأضف تجاوز
  `params.extra_body.tool_choice: "required"` لكل نموذج أعلاه، واستخدم إدخال ذلك النموذج
  فقط للجلسات التي يُتوقع فيها استدعاء أداة في كل دور.
- السلامة: النماذج المحلية تتجاوز مرشحات جانب المزوّد؛ أبقِ الوكلاء محدودين والتكثيف مفعّلاً للحد من نطاق تأثير حقن الموجّهات.

## ذو صلة

- [مرجع التكوين](/ar/gateway/configuration-reference)
- [تجاوز فشل النموذج](/ar/concepts/model-failover)
