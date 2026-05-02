---
read_when:
    - تريد تقديم النماذج من جهازك الخاص المزود بوحدة GPU.
    - أنت تقوم بربط LM Studio أو وكيلًا متوافقًا مع OpenAI
    - تحتاج إلى إرشادات النموذج المحلي الأكثر أمانًا
summary: تشغيل OpenClaw على نماذج اللغة الكبيرة المحلية (LM Studio وvLLM وLiteLLM ونقاط نهاية OpenAI المخصّصة)
title: النماذج المحلية
x-i18n:
    generated_at: "2026-05-02T22:19:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 29ab8530620370e0c213714bf6fef67bafed878055102cea47935c85b6238ffb
    source_path: gateway/local-models.md
    workflow: 16
---

النماذج المحلية ممكنة. لكنها ترفع أيضًا متطلبات العتاد، وحجم السياق، والدفاع ضد حقن الموجهات — فالبطاقات الصغيرة أو المضغوطة كميًا بشدة تقطع السياق وتضعف السلامة. هذه الصفحة هي الدليل الموجّه للمكدسات المحلية الأعلى أداءً والخوادم المحلية المخصصة المتوافقة مع OpenAI. لأقل تجربة إعداد تعقيدًا، ابدأ بـ [LM Studio](/ar/providers/lmstudio) أو [Ollama](/ar/providers/ollama) و`openclaw onboard`.

## الحد الأدنى للعتاد

استهدف مستوى عاليًا: **≥2 من أجهزة Mac Studio بالمواصفات القصوى أو منصة GPU مكافئة (~$30k+)** للحصول على حلقة وكيل مريحة. يعمل GPU واحد بسعة **24 GB** فقط للموجهات الأخف وبزمن استجابة أعلى. شغّل دائمًا **أكبر متغير / المتغير كامل الحجم يمكنك استضافته**؛ فالنقاط المرجعية الصغيرة أو المضغوطة كميًا بشدة تزيد خطر حقن الموجهات (راجع [الأمان](/ar/gateway/security)).

## اختر خلفية تشغيل

| خلفية التشغيل                                      | استخدمها عندما                                                                 |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [LM Studio](/ar/providers/lmstudio)                     | إعداد محلي لأول مرة، محمّل بواجهة رسومية، Responses API أصلية              |
| [Ollama](/ar/providers/ollama)                          | سير عمل CLI، مكتبة نماذج، خدمة systemd تعمل دون تدخل                       |
| MLX / vLLM / SGLang                                  | تقديم ذاتي الاستضافة عالي الإنتاجية مع نقطة نهاية HTTP متوافقة مع OpenAI |
| LiteLLM / OAI-proxy / وكيل مخصص متوافق مع OpenAI | تضع API نموذجًا آخر في الواجهة وتحتاج إلى أن يتعامل معه OpenClaw كأنه OpenAI |

استخدم Responses API (`api: "openai-responses"`) عندما تدعمها خلفية التشغيل (LM Studio يدعمها). وإلا فالتزم بـ Chat Completions (`api: "openai-completions"`).

<Warning>
**مستخدمو WSL2 + Ollama + NVIDIA/CUDA:** يفعّل مثبت Ollama الرسمي على Linux خدمة systemd مع `Restart=always`. في إعدادات WSL2 GPU، يمكن للتشغيل التلقائي إعادة تحميل آخر نموذج أثناء الإقلاع وتثبيت ذاكرة المضيف. إذا كانت آلة WSL2 الافتراضية تعيد التشغيل مرارًا بعد تفعيل Ollama، فراجع [حلقة تعطل WSL2](/ar/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## موصى به: LM Studio + نموذج محلي كبير (Responses API)

أفضل مكدس محلي حاليًا. حمّل نموذجًا كبيرًا في LM Studio (على سبيل المثال، بناء Qwen أو DeepSeek أو Llama كامل الحجم)، وفعّل الخادم المحلي (الافتراضي `http://127.0.0.1:1234`)، واستخدم Responses API لإبقاء التفكير منفصلًا عن النص النهائي.

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

**قائمة التحقق للإعداد**

- ثبّت LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- في LM Studio، نزّل **أكبر بناء نموذج متاح** (تجنب المتغيرات “الصغيرة”/المضغوطة كميًا بشدة)، وابدأ الخادم، وتأكد من أن `http://127.0.0.1:1234/v1/models` يعرضه.
- استبدل `my-local-model` بمعرّف النموذج الفعلي الظاهر في LM Studio.
- أبقِ النموذج محمّلًا؛ فالتحميل البارد يضيف زمن بدء.
- عدّل `contextWindow`/`maxTokens` إذا كان بناء LM Studio لديك مختلفًا.
- بالنسبة إلى WhatsApp، التزم بـ Responses API كي يُرسل النص النهائي فقط.

أبقِ النماذج المستضافة مهيأة حتى عند التشغيل محليًا؛ استخدم `models.mode: "merge"` حتى تظل البدائل الاحتياطية متاحة.

### تهيئة هجينة: أساسي مستضاف، واحتياطي محلي

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

بدّل ترتيب النموذج الأساسي والبديل الاحتياطي؛ وأبقِ كتلة المزوّدين نفسها و`models.mode: "merge"` حتى تتمكن من الرجوع إلى Sonnet أو Opus عندما يكون الجهاز المحلي متوقفًا.

### الاستضافة الإقليمية / توجيه البيانات

- توجد أيضًا متغيرات MiniMax/Kimi/GLM المستضافة على OpenRouter مع نقاط نهاية مثبتة إقليميًا (مثلًا، مستضافة في الولايات المتحدة). اختر المتغير الإقليمي هناك لإبقاء الحركة ضمن النطاق القانوني الذي تختاره، مع الاستمرار في استخدام `models.mode: "merge"` لبدائل Anthropic/OpenAI الاحتياطية.
- يظل المسار المحلي فقط أقوى مسار للخصوصية؛ أما التوجيه الإقليمي المستضاف فهو حل وسط عندما تحتاج إلى ميزات المزوّد لكن تريد التحكم في تدفق البيانات.

## وكلاء محليون آخرون متوافقون مع OpenAI

تعمل MLX (`mlx_lm.server`) أو vLLM أو SGLang أو LiteLLM أو OAI-proxy أو
البوابات المخصصة إذا كانت تعرض نقطة نهاية `/v1/chat/completions`
بأسلوب OpenAI. استخدم محول Chat Completions ما لم توثق خلفية التشغيل صراحة
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
تلقائيًا؛ أما نقاط نهاية LAN وtailnet وDNS الخاصة فلا تزال تحتاج إلى
`request.allowPrivateNetwork: true`.

قيمة `models.providers.<id>.models[].id` محلية للمزوّد. لا
تدرج بادئة المزوّد هناك. على سبيل المثال، يجب أن يستخدم خادم MLX يبدأ بـ
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` معرّف
الفهرس ومرجع النموذج التاليين:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

اضبط `input: ["text", "image"]` على نماذج الرؤية المحلية أو الممرّرة عبر وكيل كي تُحقن
مرفقات الصور في أدوار الوكيل. يستنتج إعداد المزوّد المخصص التفاعلي
معرّفات نماذج الرؤية الشائعة ولا يسأل إلا عن الأسماء غير المعروفة.
يستخدم الإعداد غير التفاعلي الاستنتاج نفسه؛ استخدم `--custom-image-input`
لمعرّفات الرؤية غير المعروفة أو `--custom-text-input` عندما يكون نموذج يبدو
معروفًا نصيًا فقط خلف نقطة النهاية لديك.

أبقِ `models.mode: "merge"` حتى تظل النماذج المستضافة متاحة كبدائل احتياطية.
استخدم `models.providers.<id>.timeoutSeconds` لخوادم النماذج المحلية أو البعيدة
البطيئة قبل رفع `agents.defaults.timeoutSeconds`. ينطبق مهلة المزوّد
فقط على طلبات HTTP الخاصة بالنموذج، بما في ذلك الاتصال، والترويسات، وبث الجسم،
وإلغاء الجلب المحمي الكلي.

<Note>
بالنسبة إلى المزوّدين المخصصين المتوافقين مع OpenAI، يُقبل حفظ مؤشر محلي غير سري مثل `apiKey: "ollama-local"` عندما يحل `baseUrl` إلى local loopback، أو LAN خاصة، أو `.local`، أو اسم مضيف مجرد. يعامله OpenClaw كاعتماد محلي صالح بدلًا من الإبلاغ عن مفتاح مفقود. استخدم قيمة حقيقية لأي مزوّد يقبل اسم مضيف عام.
</Note>

ملاحظة سلوك لخلفيات `/v1` المحلية/الممرّرة عبر وكيل:

- يتعامل OpenClaw معها كمسارات متوافقة مع OpenAI بأسلوب الوكيل، لا كنقاط نهاية
  OpenAI أصلية
- لا ينطبق تشكيل الطلبات الخاص بـ OpenAI الأصلية هنا: لا
  `service_tier`، ولا Responses `store`، ولا تشكيل حمولة توافق تفكير OpenAI،
  ولا تلميحات لذاكرة التخزين المؤقت للموجهات
- لا تُحقن ترويسات إسناد OpenClaw المخفية (`originator`، `version`، `User-Agent`)
  في عناوين URL الخاصة بالوكلاء المخصصين هذه

ملاحظات توافق لخلفيات التشغيل المتوافقة مع OpenAI الأكثر صرامة:

- تقبل بعض الخوادم فقط `messages[].content` كسلسلة في Chat Completions، وليس
  مصفوفات أجزاء محتوى منظمة. اضبط
  `models.providers.<provider>.models[].compat.requiresStringContent: true` لهذه
  النقاط.
- تصدر بعض النماذج المحلية طلبات أدوات مستقلة داخل أقواس كنص، مثل
  `[tool_name]` متبوعًا بـ JSON و`[END_TOOL_REQUEST]`. يرفع OpenClaw
  تلك إلى استدعاءات أدوات حقيقية فقط عندما يطابق الاسم بالضبط أداة مسجلة
  لذلك الدور؛ وإلا تُعامل الكتلة كنص غير مدعوم وتُخفى من الردود المرئية للمستخدم.
- إذا أصدر نموذج JSON أو XML أو نصًا بأسلوب ReAct يبدو كاستدعاء أداة
  لكن المزوّد لم يصدر استدعاءً منظمًا، يتركه OpenClaw كنص
  ويسجل تحذيرًا يتضمن معرّف التشغيل، والمزوّد/النموذج، والنمط المكتشف، واسم
  الأداة عند توفره. تعامل مع ذلك كعدم توافق في استدعاء الأدوات لدى المزوّد/النموذج،
  وليس كتشفيل أداة مكتمل.
- إذا ظهرت الأدوات كنص مساعد بدلًا من تشغيلها، مثل JSON خام،
  أو XML، أو صيغة ReAct، أو مصفوفة `tool_calls` فارغة في استجابة المزوّد،
  فتحقق أولًا من أن الخادم يستخدم قالب/محلل دردشة قادرًا على استدعاء الأدوات. بالنسبة
  إلى خلفيات Chat Completions المتوافقة مع OpenAI التي يعمل محللها فقط عند إجبار
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
  فهو يتجاوز قيمة الوكيل الافتراضية في OpenClaw وهي `tool_choice: "auto"`.
  استبدل `local/my-local-model` بمرجع المزوّد/النموذج الدقيق الذي يعرضه
  `openclaw models list`.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- إذا كان نموذج مخصص متوافق مع OpenAI يقبل جهود تفكير OpenAI تتجاوز
  الملف الشخصي المدمج، فأعلن عنها في كتلة توافق النموذج. إضافة `"xhigh"`
  هنا تجعل `/think xhigh`، ومختارات الجلسة، والتحقق في Gateway، والتحقق في `llm-task`
  تعرض المستوى لمرجع المزوّد/النموذج المهيأ هذا:

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

إذا كان النموذج يُحمّل بسلاسة لكن أدوار الوكيل الكاملة تسيء التصرف، فاعمل من الأعلى إلى الأسفل — أكد النقل أولًا، ثم ضيّق السطح.

1. **تأكّد من أن النموذج المحلي نفسه يستجيب.** بلا أدوات، وبلا سياق وكيل:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **تأكّد من توجيه Gateway.** يرسل المطالبة المقدّمة فقط — ويتجاوز النص السابق، وتمهيد AGENTS، وتجميع محرك السياق، والأدوات، وخوادم MCP المضمّنة، لكنه يظل يختبر توجيه Gateway، والمصادقة، واختيار المزوّد:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **جرّب الوضع الخفيف.** إذا نجح الفحصان لكن أدوار الوكيل الحقيقية فشلت بسبب استدعاءات أدوات مشوّهة أو مطالبات كبيرة جدًا، ففعّل `agents.defaults.experimental.localModelLean: true`. يزيل ذلك أثقل ثلاث أدوات افتراضية (`browser`، و`cron`، و`message`) بحيث تصبح بنية المطالبة أصغر وأقل هشاشة. راجع [الميزات التجريبية ← وضع النموذج المحلي الخفيف](/ar/concepts/experimental-features#local-model-lean-mode) للحصول على الشرح الكامل، ومتى تستخدمه، وكيف تتأكد من أنه مفعّل.

4. **عطّل الأدوات بالكامل كحل أخير.** إذا لم يكن الوضع الخفيف كافيًا، فعيّن `models.providers.<provider>.models[].compat.supportsTools: false` لإدخال ذلك النموذج. سيعمل الوكيل حينها بلا استدعاءات أدوات على ذلك النموذج.

5. **بعد ذلك، يكون الاختناق في المصدر الأعلى.** إذا ظلّت الواجهة الخلفية تفشل فقط في تشغيلات OpenClaw الأكبر بعد الوضع الخفيف و`supportsTools: false`، فالمشكلة المتبقية تكون عادةً في النموذج المصدر أو سعة الخادم — نافذة السياق، أو ذاكرة GPU، أو إخلاء kv-cache، أو خطأ في الواجهة الخلفية. في تلك المرحلة، ليست المشكلة في طبقة النقل الخاصة بـ OpenClaw.

## استكشاف الأخطاء وإصلاحها

- هل يستطيع Gateway الوصول إلى الوكيل؟ `curl http://127.0.0.1:1234/v1/models`.
- هل نموذج LM Studio غير محمّل؟ أعد تحميله؛ فبدء التشغيل البارد سبب شائع لـ“التعليق”.
- هل يقول الخادم المحلي `terminated` أو `ECONNRESET` أو يغلق التدفق في منتصف الدور؟
  يسجّل OpenClaw قيمة منخفضة التنوّع `model.call.error.failureKind` بالإضافة إلى
  لقطة RSS/heap لعملية OpenClaw في التشخيصات. عند ضغط الذاكرة في LM Studio/Ollama،
  طابق ذلك الطابع الزمني مع سجل الخادم أو سجل أعطال macOS /
  سجل jetsam للتأكد مما إذا كان خادم النموذج قد أُنهي.
- يستنتج OpenClaw عتبات الفحص المسبق لنافذة السياق من نافذة النموذج المكتشفة، أو من نافذة النموذج غير المحددة عندما يقلّل `agents.defaults.contextTokens` النافذة الفعالة. يحذّر دون 20% مع حد أدنى **8k**. تستخدم حالات الحظر الصارمة عتبة 10% مع حد أدنى **4k**، ومحددة بسقف نافذة السياق الفعالة بحيث لا تستطيع بيانات النموذج الوصفية المبالغ فيها رفض حد مستخدم صالح. إذا واجهت هذا الفحص المسبق، فارفع حد سياق الخادم/النموذج أو اختر نموذجًا أكبر.
- أخطاء السياق؟ خفّض `contextWindow` أو ارفع حد الخادم.
- هل يعيد خادم متوافق مع OpenAI الخطأ `messages[].content ... expected a string`؟
  أضف `compat.requiresStringContent: true` إلى إدخال ذلك النموذج.
- هل تعمل استدعاءات `/v1/chat/completions` الصغيرة المباشرة، لكن يفشل `openclaw infer model run --local`
  على Gemma أو نموذج محلي آخر؟ تحقّق أولًا من عنوان URL للمزوّد، ومرجع النموذج، وعلامة المصادقة،
  وسجلات الخادم؛ لا يتضمن `model run` المحلي أدوات الوكيل.
  إذا نجح `model run` المحلي لكن فشلت أدوار الوكيل الأكبر، فقلّل سطح أدوات الوكيل
  باستخدام `localModelLean` أو `compat.supportsTools: false`.
- هل تظهر استدعاءات الأدوات كنص JSON/XML/ReAct خام، أو يعيد المزوّد
  مصفوفة `tool_calls` فارغة؟ لا تضف وكيلاً يحوّل نص المساعد عشوائيًا
  إلى تنفيذ أدوات. أصلح قالب/محلل محادثة الخادم أولًا. إذا كان
  النموذج يعمل فقط عند فرض استخدام الأدوات، فأضف تجاوز
  `params.extra_body.tool_choice: "required"` لكل نموذج كما أعلاه، واستخدم إدخال ذلك النموذج
  فقط للجلسات التي يُتوقع فيها استدعاء أداة في كل دور.
- السلامة: تتجاوز النماذج المحلية مرشحات جانب المزوّد؛ أبقِ الوكلاء محدودين وCompaction مفعّلًا للحد من نطاق تأثير حقن المطالبات.

## ذات صلة

- [مرجع الإعدادات](/ar/gateway/configuration-reference)
- [تجاوز فشل النماذج](/ar/concepts/model-failover)
