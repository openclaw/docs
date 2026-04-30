---
read_when:
    - تريد استضافة النماذج من جهازك الخاص المزود بوحدة GPU
    - أنت تُعدّ ربط LM Studio أو وكيلاً متوافقًا مع OpenAI
    - تحتاج إلى إرشادات النموذج المحلي الأكثر أمانًا
summary: شغّل OpenClaw على نماذج اللغة الكبيرة المحلية (LM Studio وvLLM وLiteLLM ونقاط نهاية OpenAI المخصصة)
title: النماذج المحلية
x-i18n:
    generated_at: "2026-04-30T07:59:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 283da11a7896c670d3a249eeb957a252cbda7f7457bd814bb0796f3ca9956723
    source_path: gateway/local-models.md
    workflow: 16
---

المحلي ممكن، لكن OpenClaw يتوقع سياقًا كبيرًا ودفاعات قوية ضد حقن المطالبات. البطاقات الصغيرة تقتطع السياق وتضعف السلامة. ارفع السقف: **جهازي Mac Studio بالمواصفات القصوى أو أكثر، أو منصة GPU مكافئة (~$30k+)**. تعمل وحدة GPU واحدة بسعة **24 GB** فقط مع المطالبات الأخف وبزمن استجابة أعلى. استخدم **أكبر متغير/المتغير كامل الحجم من النموذج يمكنك تشغيله**؛ نقاط التحقق المضغوطة بقوة أو "الصغيرة" تزيد خطر حقن المطالبات (راجع [الأمان](/ar/gateway/security)).

إذا أردت إعدادًا محليًا بأقل احتكاك، ابدأ بـ [LM Studio](/ar/providers/lmstudio) أو [Ollama](/ar/providers/ollama) و `openclaw onboard`. هذه الصفحة هي الدليل الموجّه للتكديسات المحلية الأعلى مستوى وخوادم OpenAI-compatible المحلية المخصصة.

<Warning>
**مستخدمو WSL2 + Ollama + NVIDIA/CUDA:** يفعّل مُثبّت Ollama الرسمي لنظام Linux خدمة systemd مع `Restart=always`. في إعدادات WSL2 GPU، يمكن للتشغيل التلقائي إعادة تحميل آخر نموذج أثناء الإقلاع وتثبيت ذاكرة المضيف. إذا كانت آلة WSL2 الافتراضية لديك تعيد التشغيل مرارًا بعد تفعيل Ollama، فراجع [حلقة تعطل WSL2](/ar/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## الموصى به: LM Studio + نموذج محلي كبير (Responses API)

أفضل تكديسة محلية حاليًا. حمّل نموذجًا كبيرًا في LM Studio (مثل بناء كامل الحجم من Qwen أو DeepSeek أو Llama)، وفعّل الخادم المحلي (الافتراضي `http://127.0.0.1:1234`)، واستخدم Responses API لإبقاء الاستدلال منفصلًا عن النص النهائي.

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

**قائمة إعداد مرجعية**

- ثبّت LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- في LM Studio، نزّل **أكبر بناء نموذج متاح** (تجنب المتغيرات "الصغيرة"/المكمّمة بكثافة)، وابدأ الخادم، وتأكد أن `http://127.0.0.1:1234/v1/models` يعرضه.
- استبدل `my-local-model` بمعرّف النموذج الفعلي الظاهر في LM Studio.
- أبقِ النموذج محمّلًا؛ فالتحميل البارد يضيف زمن بدء.
- اضبط `contextWindow`/`maxTokens` إذا اختلف بناء LM Studio لديك.
- بالنسبة إلى WhatsApp، التزم بـ Responses API حتى يُرسل النص النهائي فقط.

أبقِ النماذج المستضافة مهيأة حتى عند التشغيل المحلي؛ استخدم `models.mode: "merge"` لكي تبقى البدائل الاحتياطية متاحة.

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

### المحلي أولًا مع شبكة أمان مستضافة

بدّل ترتيب الأساسي والاحتياطي؛ أبقِ كتلة المزوّدين نفسها و `models.mode: "merge"` حتى تتمكن من الرجوع إلى Sonnet أو Opus عندما يكون الجهاز المحلي متوقفًا.

### الاستضافة الإقليمية / توجيه البيانات

- توجد أيضًا متغيرات MiniMax/Kimi/GLM المستضافة على OpenRouter مع نقاط نهاية مثبتة إقليميًا (مثل مستضافة في الولايات المتحدة). اختر المتغير الإقليمي هناك لإبقاء حركة البيانات ضمن الولاية القضائية التي تختارها مع الاستمرار في استخدام `models.mode: "merge"` لبدائل Anthropic/OpenAI الاحتياطية.
- يبقى المحلي فقط أقوى مسار للخصوصية؛ أما التوجيه الإقليمي المستضاف فهو حل وسط عندما تحتاج ميزات المزوّد لكن تريد التحكم في تدفق البيانات.

## وكلاء محليون آخرون متوافقون مع OpenAI

تعمل MLX (`mlx_lm.server`) أو vLLM أو SGLang أو LiteLLM أو OAI-proxy أو
البوابات المخصصة إذا كشفت نقطة نهاية بنمط OpenAI باسم `/v1/chat/completions`.
استخدم محوّل Chat Completions ما لم يوثّق الطرف الخلفي صراحةً دعم
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
`openai-completions`. نقاط نهاية local loopback مثل `127.0.0.1` موثوقة
تلقائيًا؛ أما نقاط نهاية LAN وtailnet وDNS الخاص فما زالت تحتاج إلى
`request.allowPrivateNetwork: true`.

قيمة `models.providers.<id>.models[].id` محلية للمزوّد. لا تُضمّن
بادئة المزوّد هناك. على سبيل المثال، يجب أن يستخدم خادم MLX الذي يبدأ بـ
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` معرّف الكتالوج ومرجع النموذج التاليين:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

عيّن `input: ["text", "image"]` في نماذج الرؤية المحلية أو الموكّلة حتى
تُحقن مرفقات الصور في أدوار الوكيل. يستنتج الإعداد التفاعلي للمزوّد المخصص
معرّفات نماذج الرؤية الشائعة ولا يسأل إلا عن الأسماء غير المعروفة.
يستخدم الإعداد غير التفاعلي الاستنتاج نفسه؛ استخدم `--custom-image-input`
لمعرّفات الرؤية غير المعروفة أو `--custom-text-input` عندما يكون نموذج يبدو معروفًا
نصيًا فقط خلف نقطة النهاية لديك.

أبقِ `models.mode: "merge"` حتى تبقى النماذج المستضافة متاحة كبدائل احتياطية.
استخدم `models.providers.<id>.timeoutSeconds` لخوادم النماذج المحلية أو البعيدة البطيئة
قبل رفع `agents.defaults.timeoutSeconds`. ينطبق مهلة المزوّد
فقط على طلبات HTTP الخاصة بالنموذج، بما في ذلك الاتصال، والترويسات، وبث الجسم،
وإجهاض الجلب المحروس الكلي.

<Note>
بالنسبة إلى المزوّدين المخصصين المتوافقين مع OpenAI، يُقبل حفظ مؤشر محلي غير سري مثل `apiKey: "ollama-local"` عندما يتحلل `baseUrl` إلى loopback أو LAN خاص أو `.local` أو اسم مضيف مجرد. يتعامل OpenClaw معه كاعتماد محلي صالح بدلًا من الإبلاغ عن مفتاح مفقود. استخدم قيمة حقيقية لأي مزوّد يقبل اسم مضيف عامًا.
</Note>

ملاحظة سلوك للأطراف الخلفية المحلية/الموكّلة لـ `/v1`:

- يتعامل OpenClaw معها كمسارات وكيل متوافقة مع OpenAI، وليس كنقاط نهاية
  OpenAI أصلية
- لا ينطبق تشكيل الطلبات الخاص بـ OpenAI الأصلية هنا: لا
  `service_tier`، ولا `store` في Responses، ولا تشكيل حمولة توافق الاستدلال في OpenAI،
  ولا تلميحات تخزين المطالبات مؤقتًا
- لا تُحقن ترويسات إسناد OpenClaw المخفية (`originator` و`version` و`User-Agent`)
  في عناوين URL الخاصة بهذه الوكلاء المخصصين

ملاحظات توافق للأطراف الخلفية الأكثر صرامة المتوافقة مع OpenAI:

- بعض الخوادم لا تقبل إلا `messages[].content` النصي في Chat Completions، وليس
  مصفوفات أجزاء المحتوى المهيكلة. عيّن
  `models.providers.<provider>.models[].compat.requiresStringContent: true` لهذه
  النقاط النهائية.
- بعض النماذج المحلية تصدر طلبات أدوات مستقلة بين أقواس كنص، مثل
  `[tool_name]` متبوعًا بـ JSON و`[END_TOOL_REQUEST]`. يرقّي OpenClaw
  هذه إلى استدعاءات أدوات حقيقية فقط عندما يطابق الاسم تمامًا أداة مسجلة
  للدور؛ وإلا فتُعامل الكتلة كنص غير مدعوم وتُخفى من الردود المرئية للمستخدم.
- إذا أصدر نموذج JSON أو XML أو نصًا بنمط ReAct يبدو كاستدعاء أداة
  لكن المزوّد لم يصدر استدعاءً مهيكلًا، يتركه OpenClaw كنص
  ويسجل تحذيرًا مع معرّف التشغيل، والمزوّد/النموذج، والنمط المكتشف، واسم
  الأداة عند توفره. تعامل مع ذلك كعدم توافق في استدعاءات الأدوات لدى المزوّد/النموذج،
  وليس كتشغيل أداة مكتمل.
- إذا ظهرت الأدوات كنص مساعد بدلًا من التشغيل، مثل JSON خام أو
  XML أو صيغة ReAct أو مصفوفة `tool_calls` فارغة في استجابة المزوّد،
  فتحقق أولًا من أن الخادم يستخدم قالب/محلل دردشة قادرًا على استدعاء الأدوات. بالنسبة إلى
  الأطراف الخلفية Chat Completions المتوافقة مع OpenAI التي لا يعمل محللها إلا عندما يكون استخدام
  الأدوات مفروضًا، عيّن تجاوز طلب لكل نموذج بدلًا من الاعتماد على تحليل النص:

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
  استبدل `local/my-local-model` بمرجع المزوّد/النموذج الدقيق الظاهر من
  `openclaw models list`.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- إذا كان نموذج مخصص متوافق مع OpenAI يقبل جهود استدلال OpenAI تتجاوز
  الملف التعريفي المدمج، فصرّح بها في كتلة توافق النموذج. إضافة `"xhigh"`
  هنا تجعل `/think xhigh`، ومحددات الجلسة، وتحقق Gateway، وتحقق `llm-task`
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

- بعض الأطراف الخلفية المحلية الأصغر أو الأكثر صرامة غير مستقرة مع شكل
  مطالبة وقت تشغيل الوكيل الكامل في OpenClaw، خاصة عند تضمين مخططات الأدوات. تحقق أولًا
  من مسار المزوّد باستخدام الفحص المحلي الخفيف:

  ```bash
  openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  للتحقق من مسار Gateway دون شكل مطالبة الوكيل الكامل، استخدم
  فحص نموذج Gateway بدلًا من ذلك:

  ```bash
  openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  يرسل فحصا النموذج المحلي وGateway المطالبة المقدمة فقط. ما زال
  فحص Gateway يتحقق من توجيه Gateway والمصادقة واختيار المزوّد،
  لكنه يتجاوز عمدًا نص الجلسة السابق، وسياق AGENTS/bootstrap،
  وتجميع محرك السياق، والأدوات، وخوادم MCP المضمنة.

  إذا نجح ذلك لكن تعذّرت أدوار وكيل OpenClaw العادية، فجرّب أولًا
  `agents.defaults.experimental.localModelLean: true` لإسقاط الأدوات
  الافتراضية الثقيلة مثل `browser` و`cron` و`message`؛ هذه علامة تجريبية
  وليست إعدادًا ثابتًا لوضع افتراضي. راجع
  [الميزات التجريبية](/ar/concepts/experimental-features). إذا ظل ذلك يفشل، فجرّب
  `models.providers.<provider>.models[].compat.supportsTools: false`.

- إذا ظل backend يفشل فقط في تشغيلات OpenClaw الأكبر، فالمشكلة المتبقية
  تكون عادةً في سعة النموذج/الخادم upstream أو في خطأ في backend، وليست في
  طبقة النقل الخاصة بـ OpenClaw.

## استكشاف الأخطاء وإصلاحها

- هل يستطيع Gateway الوصول إلى proxy؟ `curl http://127.0.0.1:1234/v1/models`.
- هل نموذج LM Studio غير محمّل؟ أعد تحميله؛ فبدء التشغيل البارد سبب شائع لـ “التعليق”.
- هل يقول الخادم المحلي `terminated` أو `ECONNRESET` أو يغلق الدفق في منتصف الدور؟
  يسجّل OpenClaw قيمة منخفضة التنوّع في `model.call.error.failureKind` بالإضافة إلى
  لقطة RSS/heap لعملية OpenClaw في التشخيصات. بالنسبة لضغط الذاكرة في LM Studio/Ollama،
  طابق ذلك الطابع الزمني مع سجل الخادم أو سجل تعطل macOS /
  سجل jetsam للتأكد مما إذا كان خادم النموذج قد قُتل.
- يستمد OpenClaw عتبات الفحص المسبق لنافذة السياق من نافذة النموذج المكتشفة، أو من نافذة النموذج غير المحددة عندما يقلّل `agents.defaults.contextTokens` النافذة الفعلية. يحذّر تحت 20% مع حد أدنى **8k**. تستخدم عمليات الحظر الصارمة عتبة 10% مع حد أدنى **4k**، وتكون محددة بسقف نافذة السياق الفعلية بحيث لا تستطيع بيانات تعريف النموذج المبالغ في حجمها رفض حد مستخدم صالح بخلاف ذلك. إذا واجهت ذلك الفحص المسبق، فارفع حد سياق الخادم/النموذج أو اختر نموذجًا أكبر.
- هل توجد أخطاء سياق؟ خفّض `contextWindow` أو ارفع حد الخادم لديك.
- هل يعيد الخادم المتوافق مع OpenAI الخطأ `messages[].content ... expected a string`؟
  أضف `compat.requiresStringContent: true` إلى إدخال ذلك النموذج.
- هل تعمل استدعاءات `/v1/chat/completions` الصغيرة المباشرة، لكن يفشل `openclaw infer model run --local`
  على Gemma أو نموذج محلي آخر؟ تحقق أولًا من عنوان URL للموفّر، ومرجع النموذج، وعلامة المصادقة،
  وسجلات الخادم؛ لا يتضمن `model run` المحلي أدوات الوكيل.
  إذا نجح `model run` المحلي لكن فشلت أدوار الوكيل الأكبر، فقلّل سطح أدوات الوكيل
  باستخدام `localModelLean` أو `compat.supportsTools: false`.
- هل تظهر استدعاءات الأدوات كنص JSON/XML/ReAct خام، أو يعيد الموفّر
  مصفوفة `tool_calls` فارغة؟ لا تضف proxy يحوّل نص المساعد عشوائيًا
  إلى تنفيذ أدوات. أصلح قالب/محلّل محادثة الخادم أولًا. إذا كان
  النموذج لا يعمل إلا عند فرض استخدام الأدوات، فأضف تجاوز
  `params.extra_body.tool_choice: "required"` لكل نموذج أعلاه واستخدم إدخال ذلك النموذج
  فقط للجلسات التي يُتوقع فيها استدعاء أداة في كل دور.
- السلامة: تتجاوز النماذج المحلية مرشحات جانب الموفّر؛ أبقِ الوكلاء محددين وCompaction مفعّلًا للحد من نطاق تأثير حقن المطالبات.

## ذات صلة

- [مرجع التكوين](/ar/gateway/configuration-reference)
- [تجاوز فشل النموذج](/ar/concepts/model-failover)
