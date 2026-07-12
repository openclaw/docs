---
read_when:
    - تريد تشغيل النماذج من جهازك المزود بوحدة معالجة رسومات خاصة بك
    - أنت تقوم بربط LM Studio أو وكيل متوافق مع OpenAI
    - أنت بحاجة إلى إرشادات حول النموذج المحلي الأكثر أمانًا
summary: شغّل OpenClaw على نماذج LLM محلية (LM Studio وvLLM وLiteLLM ونقاط نهاية OpenAI مخصّصة)
title: النماذج المحلية
x-i18n:
    generated_at: "2026-07-12T05:58:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 386d46af219a368e2ae5089a72cda4bc735c7d6a5f66aec3c314f71b63a860ec
    source_path: gateway/local-models.md
    workflow: 16
---

تعمل النماذج المحلية، لكنها ترفع متطلبات العتاد وحجم السياق والدفاع ضد حقن المطالبات: فالنماذج الصغيرة أو المُكمَّمة بشدة تقتطع السياق وتتجاوز مرشحات الأمان لدى المزوّد. تغطي هذه الصفحة الحزم المحلية المتقدمة والخوادم المخصصة المتوافقة مع OpenAI. وللمسار الأقل تعقيدًا، ابدأ باستخدام [LM Studio](/ar/providers/lmstudio) أو [Ollama](/ar/providers/ollama) والأمر `openclaw onboard`.

بالنسبة إلى الخوادم المحلية التي ينبغي ألا تبدأ إلا عندما يحتاج إليها نموذج محدد، راجع [خدمات النماذج المحلية](/ar/gateway/local-model-services).

## الحد الأدنى للعتاد

استهدف **جهازي Mac Studio أو أكثر بأعلى المواصفات، أو منظومة GPU مكافئة (نحو 30 ألف دولار أو أكثر)** للحصول على حلقة وكيل مريحة. لا تتعامل وحدة GPU واحدة بسعة **24 GB** إلا مع المطالبات الأخف، وبزمن استجابة أعلى. شغّل دائمًا **أكبر إصدار أو الإصدار الكامل الذي يمكنك استضافته** - إذ تزيد نقاط التحقق الصغيرة أو المُكمَّمة بشدة من مخاطر حقن المطالبات (راجع [الأمان](/ar/gateway/security)).

## اختيار واجهة خلفية

| الواجهة الخلفية                                      | استخدمها عندما                                                               |
| ---------------------------------------------------- | ---------------------------------------------------------------------------- |
| [ds4](/ar/providers/ds4)                                | تشغيل DeepSeek V4 Flash محليًا على macOS Metal مع استدعاءات أدوات متوافقة مع OpenAI |
| [LM Studio](/ar/providers/lmstudio)                     | الإعداد المحلي لأول مرة، ومحمّل بواجهة رسومية، وواجهة Responses API أصلية   |
| LiteLLM / OAI-proxy / وكيل مخصص متوافق مع OpenAI     | تضع وكيلاً أمام واجهة API لنموذج آخر وتحتاج إلى أن يتعامل OpenClaw معه بوصفه OpenAI |
| MLX / vLLM / SGLang                                  | تقديم ذاتي الاستضافة عالي الإنتاجية عبر نقطة نهاية HTTP متوافقة مع OpenAI   |
| [Ollama](/ar/providers/ollama)                          | سير عمل CLI، ومكتبة نماذج، وخدمة systemd تعمل دون تدخل يدوي                  |

استخدم `api: "openai-responses"` عندما تدعمها الواجهة الخلفية (يدعمها LM Studio). وإلا فاستخدم `api: "openai-completions"`. إذا حُذفت `api` من مزوّد مخصص يحتوي على `baseUrl`، يستخدم OpenClaw القيمة الافتراضية `openai-completions`.

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA:** يفعّل مثبّت Ollama الرسمي لنظام Linux خدمة systemd تتضمن `Restart=always`. في إعدادات GPU على WSL2، قد تعيد ميزة التشغيل التلقائي تحميل آخر نموذج أثناء الإقلاع وتحتجز ذاكرة المضيف، مما يتسبب في إعادة تشغيل الجهاز الافتراضي مرارًا. راجع [حلقة تعطل WSL2](/ar/providers/ollama#troubleshooting).
</Warning>

## LM Studio + نموذج محلي كبير (Responses API)

هذه أفضل حزمة محلية متاحة حاليًا. حمّل نموذجًا كبيرًا في LM Studio (إصدارًا كامل الحجم من Qwen أو DeepSeek أو Llama)، وفعّل الخادم المحلي (القيمة الافتراضية `http://127.0.0.1:1234`)، واستخدم Responses API لإبقاء الاستدلال منفصلًا عن النص النهائي.

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

قائمة تحقق الإعداد:

- ثبّت LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- نزّل **أكبر إصدار متاح من النموذج** (تجنّب الإصدارات «الصغيرة» أو المُكمَّمة بشدة)، وشغّل الخادم، وتأكد من أن `http://127.0.0.1:1234/v1/models` يعرضه.
- استبدل `my-local-model` بمعرّف النموذج الفعلي المعروض في LM Studio.
- أبقِ النموذج محمّلًا؛ إذ يضيف التحميل البارد زمن تأخير عند بدء التشغيل.
- اضبط `contextWindow` و`maxTokens` إذا اختلف إصدار LM Studio لديك.
- مع WhatsApp، التزم باستخدام Responses API بحيث لا يُرسل سوى النص النهائي.
- أبقِ `models.mode: "merge"` لكي تظل النماذج المستضافة متاحة كخيارات احتياطية.

### إعداد هجين: نموذج أساسي مستضاف وخيار احتياطي محلي

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

لجعل التشغيل المحلي هو الخيار الأول مع شبكة أمان مستضافة، بدّل ترتيب `primary` و`fallbacks` مع الإبقاء على كتلة `providers` نفسها وعلى `models.mode: "merge"`.

### الاستضافة الإقليمية / توجيه البيانات

تتوفر أيضًا إصدارات MiniMax وKimi وGLM مستضافة على OpenRouter مع نقاط نهاية مقيّدة بمنطقة محددة (مثل الاستضافة داخل الولايات المتحدة). اختر الإصدار الإقليمي لإبقاء حركة البيانات ضمن النطاق القانوني الذي اخترته، مع الإبقاء على `models.mode: "merge"` للخيارات الاحتياطية من Anthropic وOpenAI. يظل التشغيل المحلي فقط أقوى مسار للخصوصية؛ أما التوجيه الإقليمي المستضاف فهو حل وسط عندما تحتاج إلى ميزات المزوّد مع الرغبة في التحكم في تدفق البيانات.

## وكلاء محليون آخرون متوافقون مع OpenAI

يعمل MLX (`mlx_lm.server`) أو vLLM أو SGLang أو LiteLLM أو OAI-proxy أو أي Gateway مخصص إذا كان يعرض نقطة نهاية `/v1/chat/completions` وفق نمط OpenAI. استخدم `openai-completions` ما لم توثّق الواجهة الخلفية صراحةً دعم `/v1/responses`.

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

تثق إدخالات المزوّد المخصص أو المحلي في الأصل المحدد بدقة ضمن `baseUrl` لطلبات النماذج المحمية، بما يشمل local loopback والشبكة المحلية وشبكة tailnet ومضيفات DNS الخاصة. وتُحظر دائمًا أصول بيانات التعريف والروابط المحلية بغض النظر عن ذلك. أما الطلبات إلى أصول خاصة أخرى، فما زالت تتطلب `models.providers.<id>.request.allowPrivateNetwork: true`؛ اضبط علامة الثقة على `false` لإلغاء الثقة في الأصل المطابق تمامًا.

تكون قيمة `models.providers.<id>.models[].id` محلية بالنسبة إلى المزوّد - فلا تُضمّن بادئة المزوّد. بالنسبة إلى خادم MLX شُغّل باستخدام `mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit`:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

اضبط `input: ["text", "image"]` في نماذج الرؤية المحلية أو التي تعمل عبر وكيل، حتى تُدرج مرفقات الصور في أدوار الوكيل. يستنتج الإعداد التفاعلي للمزوّد المخصص معرّفات نماذج الرؤية الشائعة ولا يسأل إلا عن الأسماء غير المعروفة؛ ويستخدم الإعداد غير التفاعلي الاستنتاج نفسه، مع `--custom-image-input` و`--custom-text-input` لتجاوزه.

استخدم `models.providers.<id>.timeoutSeconds` لخوادم النماذج المحلية أو البعيدة البطيئة قبل رفع `agents.defaults.timeoutSeconds`. تغطي مهلة المزوّد الاتصال والترويسات وبث المتن والإلغاء الكلي للجلب المحمي لطلبات HTTP الخاصة بالنماذج فقط - وإذا كانت مهلة الوكيل أو التشغيل أقل، فارفعها أيضًا، لأن مهلة المزوّد لا تستطيع تمديد مدة التشغيل كاملة.

<Note>
بالنسبة إلى المزوّدين المخصصين المتوافقين مع OpenAI، تُقبل علامة محلية غير سرية مثل `apiKey: "ollama-local"` عندما يُحل `baseUrl` إلى local loopback أو شبكة محلية خاصة أو `.local` أو اسم مضيف مجرد - إذ يعاملها OpenClaw على أنها بيانات اعتماد محلية صالحة بدلًا من الإبلاغ عن مفتاح مفقود. استخدم قيمة حقيقية لأي مزوّد يقبل اسم مضيف عامًا.
</Note>

ملاحظات سلوكية للواجهات الخلفية المحلية أو العاملة عبر وكيل في `/v1`:

- يتعامل OpenClaw معها بوصفها مسارات متوافقة مع OpenAI وفق نمط الوكيل، لا نقاط نهاية OpenAI أصلية.
- لا ينطبق تشكيل الطلبات الخاص بنقاط OpenAI الأصلية فقط: لا `service_tier`، ولا `store` في Responses، ولا تشكيل حمولات توافق الاستدلال في OpenAI، ولا تلميحات لذاكرة التخزين المؤقت للمطالبات.
- لا تُدرج ترويسات إسناد OpenClaw المخفية (`originator` و`version` و`User-Agent`) في عناوين URL للوكلاء المخصصين.

تجاوزات التوافق للواجهات الخلفية الأكثر صرامة والمتوافقة مع OpenAI:

- **محتوى نصي فقط**: لا تقبل بعض الخوادم في `messages[].content` سوى سلسلة نصية، وليس مصفوفات منظّمة من أجزاء المحتوى. اضبط `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- **مفاتيح رسائل صارمة**: إذا رفض الخادم إدخالات الرسائل التي تحتوي على أكثر من `role` و`content`، فاضبط `compat.strictMessageKeys: true`.
- **نص أداة محاط بأقواس**: تُصدر بعض النماذج المحلية طلبات أدوات مستقلة محاطة بأقواس على هيئة نص، مثل `[tool_name]` متبوعًا بـ JSON ثم `[END_TOOL_REQUEST]`. يرقّي OpenClaw هذه الطلبات إلى استدعاءات أدوات حقيقية فقط عندما يطابق الاسم أداة مسجلة للدور مطابقة تامة؛ وإلا يبقى النص مخفيًا وغير مدعوم.
- **نص غير منظّم يشبه استدعاء أداة**: إذا أصدر نموذج نصًا بأسلوب JSON أو XML أو ReAct يبدو كأنه استدعاء أداة، لكنه لم يكن استدعاءً منظّمًا، يُبقيه OpenClaw كنص ويسجّل تحذيرًا يتضمن معرّف التشغيل والمزوّد والنموذج والنمط المكتشف واسم الأداة عند توفره. وهذا عدم توافق بين المزوّد أو النموذج، وليس تشغيلًا مكتملًا للأداة.
- **فرض استخدام الأدوات**: إذا ظهرت الأدوات كنص من المساعد (JSON أو XML أو ReAct خام، أو مصفوفة `tool_calls` فارغة)، فتحقق أولًا من أن قالب المحادثة أو المحلّل في الخادم يدعم استدعاءات الأدوات. إذا كان المحلّل لا يعمل إلا عند فرض استخدام الأدوات، فتجاوز القيمة الافتراضية للوكيل `tool_choice: "auto"` لكل نموذج:

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

  استخدم هذا فقط عندما ينبغي لكل دور عادي استدعاء أداة. استبدل `local/my-local-model` بالمرجع الدقيق من `openclaw models list`، أو اضبطه عبر CLI:

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- **مستويات إضافية لجهد الاستدلال**: إذا كان نموذج مخصص متوافق مع OpenAI يقبل مستويات جهد استدلال من OpenAI تتجاوز ملف التعريف المدمج، فأعلن عنها في كتلة التوافق الخاصة بالنموذج. تؤدي إضافة `"xhigh"` إلى إتاحته لمرجع ذلك النموذج في `/think xhigh` ومنتقيات الجلسات والتحقق في Gateway والتحقق في `llm-task`:

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

إذا حُمّل النموذج بنجاح، لكن أدوار الوكيل الكاملة لم تعمل كما ينبغي، فاعمل من الأعلى إلى الأسفل: تحقق أولًا من النقل، ثم ضيّق النطاق.

1. **تأكد من استجابة النموذج المحلي** - من دون أدوات أو سياق للوكيل:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **تأكيد توجيه Gateway** - يرسل الموجّه فقط، متجاوزًا سجل المحادثة، وتهيئة AGENTS، وتجميع محرك السياق، والأدوات، وخوادم MCP المضمّنة، لكنه يظل يختبر توجيه Gateway، والمصادقة، واختيار المزوّد:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **جرّب الوضع الخفيف** إذا نجح كلا الاختبارين، لكن فشلت دورات الوكيل الفعلية بسبب استدعاءات أدوات مشوّهة أو موجّهات كبيرة جدًا: عيّن `agents.defaults.experimental.localModelLean: true`. يستبعد هذا أدوات المتصفح وCron والمراسلة وتوليد الوسائط والصوت وPDF الثقيلة ما لم تكن مطلوبة صراحةً، ويضع كتالوجات الأدوات الأكبر افتراضيًا خلف عناصر تحكم «البحث المنظّم عن الأدوات»، مع إبقاء `exec` ظاهرًا مباشرةً. راجع [الميزات التجريبية -> الوضع الخفيف للنموذج المحلي](/ar/concepts/experimental-features#local-model-lean-mode) للاطلاع على التفاصيل وكيفية التأكد من تفعيله.

4. **عطّل الأدوات بالكامل كحل أخير** من خلال تعيين `models.providers.<provider>.models[].compat.supportsTools: false` لذلك النموذج - سيعمل الوكيل بعد ذلك من دون استدعاءات أدوات.

5. **بعد ذلك، يكون عنق الزجاجة في المنظومة المصدرية.** إذا استمرت الواجهة الخلفية في الفشل فقط مع عمليات OpenClaw الأكبر بعد تفعيل الوضع الخفيف و`supportsTools: false`، فعادةً ما تكون المشكلة المتبقية في النموذج أو الخادم نفسه - مثل نافذة السياق، أو ذاكرة GPU، أو إخلاء ذاكرة kv-cache، أو خطأ في الواجهة الخلفية - وليست في طبقة النقل في OpenClaw.

## استكشاف الأخطاء وإصلاحها

- **يتعذر على Gateway الوصول إلى الوكيل؟** `curl http://127.0.0.1:1234/v1/models`.
- **هل أُلغي تحميل نموذج LM Studio؟** أعد تحميله؛ فبدء التشغيل البارد سبب شائع «للتعليق».
- **هل يعرض الخادم المحلي `terminated` أو `ECONNRESET`، أو يغلق التدفق في منتصف الدورة؟** يسجّل OpenClaw قيمة `model.call.error.failureKind` منخفضة التنوّع مع لقطة لاستخدام RSS/الكومة لعملية OpenClaw ضمن بيانات التشخيص. بالنسبة إلى ضغط الذاكرة في LM Studio/Ollama، طابق ذلك الطابع الزمني مع سجل الخادم أو سجل تعطل/jetsam في macOS للتأكد مما إذا كانت عملية خادم النموذج قد أُنهِيت.
- **أخطاء في السياق؟** يشتق OpenClaw حدود الفحص المسبق لنافذة السياق من نافذة النموذج المكتشفة (أو النافذة المحدودة عندما يخفضها `agents.defaults.contextTokens`)، فيُصدر تحذيرًا عند انخفاضها عن 20% بحد أدنى قدره **8k**، ويمنع التشغيل منعًا صارمًا عند انخفاضها عن 10% بحد أدنى قدره **4k** (مع تقييدها بنافذة السياق الفعلية كي لا تتسبب بيانات النموذج الوصفية ذات الحجم المبالغ فيه في رفض حد صالح عيّنه المستخدم). اخفض `contextWindow` أو ارفع حد السياق في الخادم/النموذج.
- **هل يظهر الخطأ `messages[].content ... expected a string`؟** أضف `compat.requiresStringContent: true` إلى إدخال ذلك النموذج.
- **هل يظهر `validation.keys`، أو "message entries only allow `role` and `content`"؟** أضف `compat.strictMessageKeys: true` إلى إدخال ذلك النموذج.
- **هل تنجح الاستدعاءات المباشرة إلى `/v1/chat/completions`، لكن يفشل `openclaw infer model run --local` مع Gemma أو نموذج محلي آخر؟** تحقّق أولًا من عنوان URL للمزوّد، ومرجع النموذج، وعلامة المصادقة، وسجلات الخادم - إذ يتجاوز `model run` أدوات الوكيل بالكامل. إذا نجح `model run` لكن فشلت دورات الوكيل الأكبر، فقلّص نطاق الأدوات باستخدام `localModelLean` أو `compat.supportsTools: false`.
- **هل تظهر استدعاءات الأدوات كنص JSON/XML/ReAct خام، أو يعيد المزوّد مصفوفة `tool_calls` فارغة؟** لا تضف وكيلًا يحوّل نص المساعد عشوائيًا إلى تنفيذ للأدوات - أصلح أولًا قالب المحادثة/المحلّل في الخادم. إذا كان النموذج لا يعمل إلا عند فرض استخدام الأدوات، فأضف تجاوز `params.extra_body.tool_choice: "required"` الموضّح أعلاه، واستخدم إدخال النموذج هذا فقط للجلسات التي يُتوقع فيها استدعاء أداة في كل دورة.
- **السلامة**: تتجاوز النماذج المحلية عوامل التصفية من جانب المزوّد. أبقِ نطاق الوكلاء ضيقًا وCompaction مفعّلًا للحد من نطاق تأثير حقن الموجّهات.

## ذو صلة

- [مرجع الإعدادات](/ar/gateway/configuration-reference)
- [التبديل الاحتياطي للنموذج](/ar/concepts/model-failover)
