---
read_when:
    - تريد تقديم النماذج من جهاز GPU الخاص بك
    - تقوم بربط LM Studio أو وكيلاً متوافقًا مع OpenAI
    - تحتاج إلى إرشادات النموذج المحلي الأكثر أمانًا
summary: تشغيل OpenClaw على نماذج LLM المحلية (LM Studio وvLLM وLiteLLM ونقاط نهاية OpenAI المخصصة)
title: النماذج المحلية
x-i18n:
    generated_at: "2026-05-06T07:54:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: cf0a1f960c5d0bd93eebb49e10db1066c305b2bc64401eb5000bf559f7e62349
    source_path: gateway/local-models.md
    workflow: 16
---

النماذج المحلية قابلة للتنفيذ. لكنها ترفع أيضًا متطلبات العتاد، وحجم السياق، والدفاع ضد حقن الموجّه — فالبطاقات الصغيرة أو المكمّمة بقوة تختصر السياق وتسرّب الأمان. هذه الصفحة هي الدليل الموجّه للمنظومات المحلية الأعلى قدرة والخوادم المحلية المخصصة المتوافقة مع OpenAI. للبدء بأقل احتكاك، ابدأ بـ [LM Studio](/ar/providers/lmstudio) أو [Ollama](/ar/providers/ollama) و `openclaw onboard`.

## الحد الأدنى للعتاد

استهدف مستوى عاليًا: **≥2 جهاز Mac Studio بأقصى مواصفات أو منظومة GPU مكافئة (~$30k+)** لحلقة وكيل مريحة. تعمل بطاقة GPU واحدة بسعة **24 GB** فقط مع الموجّهات الأخف وبزمن استجابة أعلى. شغّل دائمًا **أكبر متغير / المتغير بالحجم الكامل يمكنك استضافته**؛ إذ إن نقاط التحقق الصغيرة أو المكمّمة بشدة تزيد خطر حقن الموجّه (راجع [الأمان](/ar/gateway/security)).

## اختر خلفية تشغيل

| خلفية التشغيل                                        | استخدمها عندما                                                              |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [LM Studio](/ar/providers/lmstudio)                     | إعداد محلي لأول مرة، محمّل بواجهة رسومية، Responses API أصلي               |
| [Ollama](/ar/providers/ollama)                          | سير عمل CLI، مكتبة نماذج، خدمة systemd بلا تدخل                            |
| MLX / vLLM / SGLang                                  | تقديم ذاتي الاستضافة عالي الإنتاجية مع نقطة نهاية HTTP متوافقة مع OpenAI   |
| LiteLLM / OAI-proxy / وكيل مخصص متوافق مع OpenAI    | تكون واجهة أمامية لواجهة API نموذج أخرى وتحتاج أن يعاملها OpenClaw كـ OpenAI |

استخدم Responses API (`api: "openai-responses"`) عندما تدعمها خلفية التشغيل (يدعمها LM Studio). وإلا فالتزم بـ Chat Completions (`api: "openai-completions"`).

<Warning>
**مستخدمو WSL2 + Ollama + NVIDIA/CUDA:** يفعّل مثبّت Ollama Linux الرسمي خدمة systemd مع `Restart=always`. في إعدادات WSL2 GPU، يمكن أن يعيد التشغيل التلقائي تحميل آخر نموذج أثناء الإقلاع ويثبّت ذاكرة المضيف. إذا كانت آلة WSL2 الافتراضية لديك تعيد التشغيل مرارًا بعد تفعيل Ollama، فراجع [حلقة تعطل WSL2](/ar/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## موصى به: LM Studio + نموذج محلي كبير (Responses API)

أفضل منظومة محلية حاليًا. حمّل نموذجًا كبيرًا في LM Studio (على سبيل المثال، بنية Qwen أو DeepSeek أو Llama بالحجم الكامل)، وفعّل الخادم المحلي (الافتراضي `http://127.0.0.1:1234`)، واستخدم Responses API لإبقاء الاستدلال منفصلًا عن النص النهائي.

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
- في LM Studio، نزّل **أكبر بنية نموذج متاحة** (تجنب متغيرات "small"/المكمّمة بشدة)، وابدأ الخادم، وتأكد من أن `http://127.0.0.1:1234/v1/models` يعرضها.
- استبدل `my-local-model` بمعرّف النموذج الفعلي المعروض في LM Studio.
- أبقِ النموذج محمّلًا؛ فالتحميل البارد يضيف زمن بدء.
- عدّل `contextWindow`/`maxTokens` إذا كانت بنية LM Studio لديك مختلفة.
- بالنسبة إلى WhatsApp، التزم بـ Responses API بحيث لا يُرسل إلا النص النهائي.

أبقِ النماذج المستضافة مهيأة حتى عند التشغيل محليًا؛ استخدم `models.mode: "merge"` حتى تظل البدائل متاحة.

### تهيئة هجينة: أساسي مستضاف، بديل محلي

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

بدّل ترتيب الأساسي والبديل؛ وأبقِ كتلة المزوّدين نفسها و `models.mode: "merge"` حتى تتمكن من الرجوع إلى Sonnet أو Opus عندما يكون الجهاز المحلي متوقفًا.

### الاستضافة الإقليمية / توجيه البيانات

- توجد أيضًا متغيرات MiniMax/Kimi/GLM المستضافة على OpenRouter مع نقاط نهاية مثبتة إقليميًا (مثلًا، مستضافة في الولايات المتحدة). اختر المتغير الإقليمي هناك لإبقاء الحركة ضمن الولاية القضائية التي تختارها مع الاستمرار في استخدام `models.mode: "merge"` لبدائل Anthropic/OpenAI.
- يبقى المسار المحلي فقط أقوى مسار للخصوصية؛ أما التوجيه الإقليمي المستضاف فهو حل وسط عندما تحتاج ميزات المزوّد لكنك تريد التحكم في تدفق البيانات.

## وكلاء محليون آخرون متوافقون مع OpenAI

تعمل MLX (`mlx_lm.server`) و vLLM و SGLang و LiteLLM و OAI-proxy أو
البوابات المخصصة إذا كشفت نقطة نهاية بأسلوب OpenAI هي `/v1/chat/completions`.
استخدم محوّل Chat Completions ما لم توثق خلفية التشغيل صراحةً دعم
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
`openai-completions`. تُوثق نقاط نهاية الاسترجاع المحلي مثل `127.0.0.1`
تلقائيًا؛ أما نقاط نهاية LAN و tailnet و DNS الخاصة فما زالت تحتاج إلى
`request.allowPrivateNetwork: true`.

قيمة `models.providers.<id>.models[].id` محلية للمزوّد. لا
تدرج بادئة المزوّد هناك. على سبيل المثال، يجب أن يستخدم خادم MLX بدأ بالأمر
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` معرّف
الفهرس ومرجع النموذج هذين:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

اضبط `input: ["text", "image"]` على نماذج الرؤية المحلية أو الممررة عبر وكيل بحيث
تُحقن مرفقات الصور في أدوار الوكيل. يستنتج إعداد المزوّد المخصص التفاعلي
معرّفات نماذج الرؤية الشائعة ولا يسأل إلا عن الأسماء غير المعروفة.
يستخدم الإعداد غير التفاعلي الاستنتاج نفسه؛ استخدم `--custom-image-input`
لمعرّفات الرؤية غير المعروفة أو `--custom-text-input` عندما يكون نموذج يبدو
معروفًا نصيًا فقط خلف نقطة النهاية لديك.

أبقِ `models.mode: "merge"` حتى تظل النماذج المستضافة متاحة كبدائل.
استخدم `models.providers.<id>.timeoutSeconds` لخوادم النماذج المحلية أو البعيدة
البطيئة قبل رفع `agents.defaults.timeoutSeconds`. تنطبق مهلة المزوّد
فقط على طلبات HTTP الخاصة بالنماذج، بما في ذلك الاتصال، والترويسات، وبث الجسم،
وإلغاء guarded-fetch الكلي.

<Note>
بالنسبة إلى المزوّدين المخصصين المتوافقين مع OpenAI، يُقبل حفظ علامة محلية غير سرية مثل `apiKey: "ollama-local"` عندما يتحلل `baseUrl` إلى الاسترجاع المحلي، أو LAN خاصة، أو `.local`، أو اسم مضيف مجرد. يعاملها OpenClaw كاعتماد محلي صالح بدلًا من الإبلاغ عن مفتاح مفقود. استخدم قيمة حقيقية لأي مزوّد يقبل اسم مضيف عامًا.
</Note>

ملاحظة سلوكية لخلفيات تشغيل `/v1` المحلية/الممررة عبر وكيل:

- يعامل OpenClaw هذه كمسارات بأسلوب وكيل متوافقة مع OpenAI، لا كنقاط نهاية
  OpenAI أصلية
- لا ينطبق تشكيل الطلبات الخاص بـ OpenAI الأصلي هنا: لا
  `service_tier`، ولا `store` في Responses، ولا تشكيل حمولة توافق استدلال OpenAI،
  ولا تلميحات لذاكرة التخزين المؤقت للموجّه
- لا تُحقن ترويسات نسب OpenClaw المخفية (`originator`، `version`، `User-Agent`)
  على عناوين URL الخاصة بهذه الوكلاء المخصصين

ملاحظات التوافق لخلفيات التشغيل الأكثر صرامة المتوافقة مع OpenAI:

- تقبل بعض الخوادم `messages[].content` كسلسلة فقط في Chat Completions، لا
  كمصفوفات أجزاء محتوى منظمة. اضبط
  `models.providers.<provider>.models[].compat.requiresStringContent: true` لهذه
  النقاط النهائية.
- تصدر بعض النماذج المحلية طلبات أدوات مستقلة بين أقواس كنص، مثل
  `[tool_name]` متبوعًا بـ JSON و `[END_TOOL_REQUEST]`. يرقّي OpenClaw
  هذه إلى استدعاءات أدوات حقيقية فقط عندما يطابق الاسم بالضبط أداة مسجلة
  للدور؛ وإلا تُعامل الكتلة كنص غير مدعوم وتُخفى من الردود المرئية للمستخدم.
- إذا أصدر نموذج JSON أو XML أو نصًا بأسلوب ReAct يبدو كاستدعاء أداة
  لكن المزوّد لم يصدر استدعاءً منظمًا، يتركه OpenClaw كنص
  ويسجل تحذيرًا مع معرّف التشغيل، والمزوّد/النموذج، والنمط المكتشف، واسم
  الأداة عند توفره. تعامل مع ذلك كعدم توافق في استدعاء الأدوات من المزوّد/النموذج،
  لا كتشغيل أداة مكتمل.
- إذا ظهرت الأدوات كنص مساعد بدلًا من التشغيل، مثل JSON الخام،
  أو XML، أو صياغة ReAct، أو مصفوفة `tool_calls` فارغة في استجابة المزوّد،
  فتحقق أولًا من أن الخادم يستخدم قالب/محلل دردشة قادرًا على استدعاء الأدوات. بالنسبة إلى
  خلفيات Chat Completions المتوافقة مع OpenAI التي يعمل محللها فقط عند فرض
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
  استبدل `local/my-local-model` بمرجع المزوّد/النموذج الدقيق الذي يعرضه
  `openclaw models list`.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- إذا كان نموذج مخصص متوافق مع OpenAI يقبل جهود استدلال OpenAI تتجاوز
  الملف التعريفي المدمج، فصرّح بها في كتلة توافق النموذج. إضافة `"xhigh"`
  هنا تجعل `/think xhigh`، ومختارات الجلسات، والتحقق في Gateway، والتحقق في `llm-task`
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

إذا كان النموذج يُحمّل بوضوح لكن أدوار الوكيل الكاملة تتصرف بشكل خاطئ، فاعمل من الأعلى إلى الأسفل — تأكد من النقل أولًا، ثم ضيّق السطح.

1. **تأكّد من أن النموذج المحلي نفسه يستجيب.** بلا أدوات، وبلا سياق وكيل:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **تأكّد من توجيه Gateway.** يرسل المطالبة المقدّمة فقط — ويتجاوز النص المنسوخ، وتمهيد AGENTS، وتجميع محرك السياق، والأدوات، وخوادم MCP المضمّنة، لكنه لا يزال يختبر توجيه Gateway والمصادقة واختيار المزوّد:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **جرّب الوضع الخفيف.** إذا نجح كلا الاختبارين لكن جولات الوكيل الحقيقية تفشل بسبب استدعاءات أدوات مشوّهة أو مطالبات كبيرة الحجم، ففعّل `agents.defaults.experimental.localModelLean: true`. يؤدي ذلك إلى إسقاط أثقل ثلاث أدوات افتراضية (`browser` و`cron` و`message`) بحيث يصبح شكل المطالبة أصغر وأقل هشاشة. راجع [الميزات التجريبية ← الوضع الخفيف للنموذج المحلي](/ar/concepts/experimental-features#local-model-lean-mode) للاطلاع على الشرح الكامل، ومتى تستخدمه، وكيفية التأكد من أنه مفعّل.

4. **عطّل الأدوات بالكامل كملاذ أخير.** إذا لم يكن الوضع الخفيف كافيًا، فاضبط `models.providers.<provider>.models[].compat.supportsTools: false` لإدخال ذلك النموذج. سيعمل الوكيل حينها من دون استدعاءات أدوات على ذلك النموذج.

5. **بعد ذلك، تكون نقطة الاختناق في المنبع.** إذا استمر فشل الخلفية فقط في عمليات OpenClaw الأكبر بعد الوضع الخفيف و`supportsTools: false`، فغالبًا ما تكون المشكلة المتبقية في النموذج أو سعة الخادم في المنبع — نافذة السياق، أو ذاكرة GPU، أو إخلاء kv-cache، أو خطأ في الخلفية. عند تلك النقطة لا تكون المشكلة في طبقة النقل الخاصة بـ OpenClaw.

## استكشاف الأخطاء وإصلاحها

- هل يستطيع Gateway الوصول إلى الوكيل؟ `curl http://127.0.0.1:1234/v1/models`.
- هل نموذج LM Studio غير محمّل؟ أعد تحميله؛ فبدء التشغيل البارد سبب شائع لـ"التعليق".
- هل يقول الخادم المحلي `terminated` أو `ECONNRESET` أو يغلق التدفق في منتصف الجولة؟
  يسجّل OpenClaw قيمة منخفضة التنوع باسم `model.call.error.failureKind` إضافة إلى
  لقطة RSS/heap لعملية OpenClaw في التشخيصات. بالنسبة إلى ضغط الذاكرة في LM Studio/Ollama،
  طابق ذلك الطابع الزمني مع سجل الخادم أو سجل تعطل macOS /
  jetsam لتأكيد ما إذا كان خادم النموذج قد أُنهي.
- يستنتج OpenClaw عتبات الفحص المسبق لنافذة السياق من نافذة النموذج المكتشفة، أو من نافذة النموذج غير المحددة عندما يخفّض `agents.defaults.contextTokens` النافذة الفعلية. يصدر تحذيرًا دون 20% مع حد أدنى **8k**. تستخدم عمليات الحظر الصلبة عتبة 10% مع حد أدنى **4k**، مع سقف عند نافذة السياق الفعلية حتى لا تتمكن بيانات تعريف نموذج ذات حجم زائد من رفض حد مستخدم صالح بخلاف ذلك. إذا واجهت ذلك الفحص المسبق، فارفع حد سياق الخادم/النموذج أو اختر نموذجًا أكبر.
- هل توجد أخطاء سياق؟ خفّض `contextWindow` أو ارفع حد الخادم لديك.
- هل يعيد الخادم المتوافق مع OpenAI الخطأ `messages[].content ... expected a string`؟
  أضف `compat.requiresStringContent: true` إلى إدخال ذلك النموذج.
- هل تعمل استدعاءات `/v1/chat/completions` الصغيرة المباشرة، لكن يفشل `openclaw infer model run --local`
  على Gemma أو نموذج محلي آخر؟ تحقّق أولًا من عنوان URL للمزوّد، ومرجع النموذج، وعلامة المصادقة،
  وسجلات الخادم؛ فالأمر المحلي `model run` لا يتضمن أدوات الوكيل.
  إذا نجح `model run` المحلي لكن فشلت جولات الوكيل الأكبر، فقلّل سطح أدوات الوكيل
  باستخدام `localModelLean` أو `compat.supportsTools: false`.
- هل تظهر استدعاءات الأدوات كنص JSON/XML/ReAct خام، أو يعيد المزوّد
  مصفوفة `tool_calls` فارغة؟ لا تضف وكيلًا يحوّل نص المساعد بشكل أعمى
  إلى تنفيذ أدوات. أصلح قالب/محلل محادثة الخادم أولًا. إذا كان
  النموذج لا يعمل إلا عند فرض استخدام الأدوات، فأضف تجاوز
  `params.extra_body.tool_choice: "required"` لكل نموذج أعلاه، واستخدم إدخال ذلك النموذج
  فقط للجلسات التي يُتوقع فيها استدعاء أداة في كل جولة.
- السلامة: تتجاوز النماذج المحلية مرشحات جانب المزوّد؛ أبقِ الوكلاء محدودين وCompaction مفعّلًا للحد من نطاق تأثير حقن المطالبات.

## ذات صلة

- [مرجع التكوين](/ar/gateway/configuration-reference)
- [تجاوز فشل النموذج](/ar/concepts/model-failover)
