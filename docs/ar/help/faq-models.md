---
read_when:
    - اختيار النماذج أو تبديلها، وتكوين الأسماء المستعارة
    - تصحيح احتياط النماذج / "All models failed"
    - فهم ملفات تعريف المصادقة وكيفية إدارتها
sidebarTitle: Models FAQ
summary: 'الأسئلة الشائعة: الإعدادات الافتراضية للنماذج، والاختيار، والأسماء المستعارة، والتبديل، والاحتياط، وملفات تعريف المصادقة'
title: 'الأسئلة الشائعة: النماذج والمصادقة'
x-i18n:
    generated_at: "2026-04-24T07:45:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8acc0bc1ea7096ba4743defb2a1766a62ccf6c44202df82ee9c1c04e5ab62222
    source_path: help/faq-models.md
    workflow: 15
---

  أسئلة وأجوبة حول النماذج وملفات تعريف المصادقة. بالنسبة إلى الإعداد، والجلسات، وGateway، والقنوات،
  واستكشاف الأخطاء وإصلاحها، راجع [الأسئلة الشائعة](/ar/help/faq) الرئيسية.

  ## النماذج: الإعدادات الافتراضية، والاختيار، والأسماء المستعارة، والتبديل

  <AccordionGroup>
  <Accordion title='ما المقصود بـ "النموذج الافتراضي"؟'>
    النموذج الافتراضي في OpenClaw هو ما تضبطه كالتالي:

    ```
    agents.defaults.model.primary
    ```

    تتم الإشارة إلى النماذج بصيغة `provider/model` (مثل: `openai/gpt-5.4` أو `openai-codex/gpt-5.5`). وإذا حذفت المزوّد، يحاول OpenClaw أولًا اسمًا مستعارًا، ثم مطابقة فريدة لمزوّد مكوّن لذلك المعرّف الدقيق للنموذج، وبعدها فقط يعود إلى المزوّد الافتراضي المكوّن كمسار توافق قديم. وإذا لم يعد ذلك المزوّد يوفّر النموذج الافتراضي المكوّن، يعود OpenClaw إلى أول مزوّد/نموذج مكوّن بدلًا من إظهار افتراضي قديم لمزوّد تمت إزالته. ومع ذلك ينبغي أن تضبط **صراحةً** `provider/model`.

  </Accordion>

  <Accordion title="ما النموذج الذي توصي به؟">
    **الافتراضي الموصى به:** استخدم أقوى نموذج من أحدث جيل متاح في مجموعة مزوّديك.
    **بالنسبة إلى الوكلاء الممكّنين بالأدوات أو الذين يتعاملون مع إدخال غير موثوق:** اجعل قوة النموذج أولوية على التكلفة.
    **بالنسبة إلى الدردشة الروتينية/منخفضة المخاطر:** استخدم نماذج احتياطية أرخص ووجّه حسب دور الوكيل.

    لدى MiniMax وثائقه الخاصة: [MiniMax](/ar/providers/minimax) و
    [النماذج المحلية](/ar/gateway/local-models).

    القاعدة العامة: استخدم **أفضل نموذج يمكنك تحمّل تكلفته** للأعمال عالية المخاطر، واستخدم نموذجًا أرخص
    للدردشة الروتينية أو الملخصات. ويمكنك توجيه النماذج لكل وكيل واستخدام الوكلاء الفرعيين
    لموازاة المهام الطويلة (كل وكيل فرعي يستهلك رموزًا مميزة). راجع [النماذج](/ar/concepts/models) و
    [الوكلاء الفرعيون](/ar/tools/subagents).

    تحذير قوي: تكون النماذج الأضعف/المكمّمة بدرجة كبيرة أكثر عرضة لحقن
    المطالبات والسلوك غير الآمن. راجع [الأمان](/ar/gateway/security).

    مزيد من السياق: [النماذج](/ar/concepts/models).

  </Accordion>

  <Accordion title="كيف أبدّل النماذج من دون مسح التكوين؟">
    استخدم **أوامر النموذج** أو حرر حقول **model** فقط. وتجنب استبدال التكوين بالكامل.

    الخيارات الآمنة:

    - `/model` في الدردشة (سريع، لكل جلسة)
    - `openclaw models set ...` (يحدّث تكوين النموذج فقط)
    - `openclaw configure --section model` (تفاعلي)
    - حرر `agents.defaults.model` في `~/.openclaw/openclaw.json`

    تجنب `config.apply` مع كائن جزئي إلا إذا كنت تنوي استبدال التكوين بالكامل.
    بالنسبة إلى تعديلات RPC، افحص أولًا باستخدام `config.schema.lookup` وفضّل `config.patch`. تعطيك حمولة lookup المسار المطبّع، ووثائق/قيود مخطط سطحية، وملخصات الأبناء المباشرين
    للتحديثات الجزئية.
    إذا كنت قد كتبت فوق التكوين، فاستعده من النسخة الاحتياطية أو أعد تشغيل `openclaw doctor` لإصلاحه.

    الوثائق: [النماذج](/ar/concepts/models)، و[Configure](/ar/cli/configure)، و[Config](/ar/cli/config)، و[Doctor](/ar/gateway/doctor).

  </Accordion>

  <Accordion title="هل يمكنني استخدام نماذج مستضافة ذاتيًا (llama.cpp, vLLM, Ollama)؟">
    نعم. ويمثل Ollama أسهل مسار للنماذج المحلية.

    أسرع إعداد:

    1. ثبّت Ollama من `https://ollama.com/download`
    2. اسحب نموذجًا محليًا مثل `ollama pull gemma4`
    3. إذا كنت تريد نماذج سحابية أيضًا، شغّل `ollama signin`
    4. شغّل `openclaw onboard` واختر `Ollama`
    5. اختر `Local` أو `Cloud + Local`

    ملاحظات:

    - يمنحك `Cloud + Local` نماذج سحابية بالإضافة إلى نماذج Ollama المحلية لديك
    - لا تحتاج النماذج السحابية مثل `kimi-k2.5:cloud` إلى سحب محلي
    - للتبديل اليدوي، استخدم `openclaw models list` و`openclaw models set ollama/<model>`

    ملاحظة أمنية: تكون النماذج الأصغر أو المكمّمة بشدة أكثر عرضة لحقن
    المطالبات. ونحن نوصي بشدة باستخدام **نماذج كبيرة** لأي بوت يمكنه استخدام الأدوات.
    وإذا كنت لا تزال تريد نماذج صغيرة، ففعّل sandboxing وقوائم سماح الأدوات الصارمة.

    الوثائق: [Ollama](/ar/providers/ollama)، و[النماذج المحلية](/ar/gateway/local-models)،
    و[مزوّدو النماذج](/ar/concepts/model-providers)، و[الأمان](/ar/gateway/security)،
    و[Sandboxing](/ar/gateway/sandboxing).

  </Accordion>

  <Accordion title="ما النماذج التي تستخدمها OpenClaw وFlawd وKrill؟">
    - قد تختلف هذه النشرات وقد تتغير مع الوقت؛ ولا توجد توصية ثابتة بمزوّد معين.
    - تحقق من إعداد Runtime الحالي على كل Gateway باستخدام `openclaw models status`.
    - بالنسبة إلى الوكلاء الحسّاسين أمنيًا/الممكّنين بالأدوات، استخدم أقوى نموذج من أحدث جيل متاح.
  </Accordion>

  <Accordion title="كيف أبدّل النماذج أثناء التشغيل (من دون إعادة تشغيل)؟">
    استخدم الأمر `/model` كرسالة مستقلة:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    هذه هي الأسماء المستعارة المدمجة. ويمكن إضافة أسماء مستعارة مخصصة عبر `agents.defaults.models`.

    يمكنك عرض النماذج المتاحة باستخدام `/model` أو `/model list` أو `/model status`.

    يعرض `/model` (و`/model list`) محددًا مضغوطًا مرقّمًا. اختر حسب الرقم:

    ```
    /model 3
    ```

    يمكنك أيضًا فرض ملف تعريف مصادقة محدد لذلك المزوّد (لكل جلسة):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    نصيحة: يعرض `/model status` الوكيل النشط، وملف `auth-profiles.json` المستخدم، وملف تعريف المصادقة الذي ستتم تجربته بعد ذلك.
    كما يعرض نقطة نهاية المزوّد المكوّنة (`baseUrl`) ووضع API (`api`) عند توفرهما.

    **كيف ألغي تثبيت ملف تعريف قمت بضبطه باستخدام @profile؟**

    أعد تشغيل `/model` **من دون** اللاحقة `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    إذا أردت العودة إلى الافتراضي، فاختره من `/model` (أو أرسل `/model <default provider/model>`).
    استخدم `/model status` لتأكيد ملف تعريف المصادقة النشط.

  </Accordion>

  <Accordion title="هل يمكنني استخدام GPT 5.5 للمهام اليومية وCodex 5.5 للبرمجة؟">
    نعم. اضبط أحدهما كافتراضي وبدّل عند الحاجة:

    - **تبديل سريع (لكل جلسة):** استخدم `/model openai/gpt-5.4` لمهام OpenAI API-key المباشرة الحالية أو `/model openai-codex/gpt-5.5` لمهام GPT-5.5 Codex OAuth.
    - **الافتراضي:** اضبط `agents.defaults.model.primary` على `openai/gpt-5.4` لاستخدام API-key أو على `openai-codex/gpt-5.5` لاستخدام GPT-5.5 Codex OAuth.
    - **الوكلاء الفرعيون:** وجّه مهام البرمجة إلى وكلاء فرعيين بنموذج افتراضي مختلف.

    يصبح الوصول المباشر عبر API-key إلى `openai/gpt-5.5` مدعومًا عندما تفعّل OpenAI
    GPT-5.5 على API العامة. وحتى ذلك الحين يبقى GPT-5.5 مخصصًا للاشتراك/OAuth فقط.

    راجع [النماذج](/ar/concepts/models) و[أوامر slash](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="كيف أضبط fast mode لـ GPT 5.5؟">
    استخدم إما تبديلًا لكل جلسة أو قيمة افتراضية في التكوين:

    - **لكل جلسة:** أرسل `/fast on` بينما تستخدم الجلسة `openai/gpt-5.4` أو `openai-codex/gpt-5.5`.
    - **افتراضي لكل نموذج:** اضبط `agents.defaults.models["openai/gpt-5.4"].params.fastMode` أو `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` على `true`.

    مثال:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    بالنسبة إلى OpenAI، يربط fast mode إلى `service_tier = "priority"` في طلبات Responses الأصلية المدعومة. وتتغلب تجاوزات `/fast` لكل جلسة على القيم الافتراضية في التكوين.

    راجع [التفكير وfast mode](/ar/tools/thinking) و[fast mode في OpenAI](/ar/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='لماذا أرى "Model ... is not allowed" ثم لا يصل أي رد؟'>
    إذا تم ضبط `agents.defaults.models`، فإنها تصبح **قائمة السماح** لـ `/model` وأي
    تجاوزات للجلسة. ويؤدي اختيار نموذج غير موجود في تلك القائمة إلى إرجاع:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    ويتم إرجاع هذا الخطأ **بدلًا من** رد عادي. الحل: أضف النموذج إلى
    `agents.defaults.models`، أو أزل قائمة السماح، أو اختر نموذجًا من `/model list`.

  </Accordion>

  <Accordion title='لماذا أرى "Unknown model: minimax/MiniMax-M2.7"؟'>
    هذا يعني أن **المزوّد غير مكوّن** (لم يتم العثور على تكوين مزوّد MiniMax أو ملف
    تعريف مصادقة)، لذلك لا يمكن تحليل النموذج.

    قائمة التحقق من الحل:

    1. حدّث إلى إصدار OpenClaw حديث (أو شغّل من المصدر `main`)، ثم أعد تشغيل Gateway.
    2. تأكد من تكوين MiniMax (المعالج أو JSON)، أو من وجود مصادقة MiniMax
       في env/ملفات تعريف المصادقة بحيث يمكن حقن المزوّد المطابق
       (`MINIMAX_API_KEY` لـ `minimax`، أو `MINIMAX_OAUTH_TOKEN` أو MiniMax
       OAuth المخزن لـ `minimax-portal`).
    3. استخدم معرّف النموذج الدقيق (حساس لحالة الأحرف) لمسار المصادقة لديك:
       `minimax/MiniMax-M2.7` أو `minimax/MiniMax-M2.7-highspeed` لإعداد
       API-key، أو `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` لإعداد OAuth.
    4. شغّل:

       ```bash
       openclaw models list
       ```

       واختر من القائمة (أو `/model list` في الدردشة).

    راجع [MiniMax](/ar/providers/minimax) و[النماذج](/ar/concepts/models).

  </Accordion>

  <Accordion title="هل يمكنني استخدام MiniMax كافتراضي وOpenAI للمهام المعقدة؟">
    نعم. استخدم **MiniMax كافتراضي** وبدّل النماذج **لكل جلسة** عند الحاجة.
    الاحتياطات مخصصة **للأخطاء**، وليست "للمهام الصعبة"، لذا استخدم `/model` أو وكيلًا منفصلًا.

    **الخيار A: التبديل لكل جلسة**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.4": { alias: "gpt" },
          },
        },
      },
    }
    ```

    ثم:

    ```
    /model gpt
    ```

    **الخيار B: وكلاء منفصلون**

    - الوكيل A الافتراضي: MiniMax
    - الوكيل B الافتراضي: OpenAI
    - وجّه حسب الوكيل أو استخدم `/agent` للتبديل

    الوثائق: [النماذج](/ar/concepts/models)، و[التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)، و[MiniMax](/ar/providers/minimax)، و[OpenAI](/ar/providers/openai).

  </Accordion>

  <Accordion title="هل opus / sonnet / gpt اختصارات مدمجة؟">
    نعم. يأتي OpenClaw مع بعض الاختصارات الافتراضية (وتُطبّق فقط عندما يكون النموذج موجودًا في `agents.defaults.models`):

    - `opus` ← `anthropic/claude-opus-4-6`
    - `sonnet` ← `anthropic/claude-sonnet-4-6`
    - `gpt` ← `openai/gpt-5.4` لإعدادات API-key، أو `openai-codex/gpt-5.5` عند التكوين من أجل Codex OAuth
    - `gpt-mini` ← `openai/gpt-5.4-mini`
    - `gpt-nano` ← `openai/gpt-5.4-nano`
    - `gemini` ← `google/gemini-3.1-pro-preview`
    - `gemini-flash` ← `google/gemini-3-flash-preview`
    - `gemini-flash-lite` ← `google/gemini-3.1-flash-lite-preview`

    إذا ضبطت اسمًا مستعارًا خاصًا بك بالاسم نفسه، فقيمتك هي التي تفوز.

  </Accordion>

  <Accordion title="كيف أعرّف/أتجاوز اختصارات النماذج (الأسماء المستعارة)؟">
    تأتي الأسماء المستعارة من `agents.defaults.models.<modelId>.alias`. مثال:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    بعد ذلك، يحلل `/model sonnet` (أو `/<alias>` عند الدعم) إلى معرّف ذلك النموذج.

  </Accordion>

  <Accordion title="كيف أضيف نماذج من مزوّدين آخرين مثل OpenRouter أو Z.AI؟">
    OpenRouter ‏(الدفع لكل رمز؛ نماذج كثيرة):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI ‏(نماذج GLM):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    إذا أشرت إلى مزوّد/نموذج لكن مفتاح المزوّد المطلوب مفقود، فستحصل على خطأ مصادقة في Runtime (مثل `No API key found for provider "zai"`).

    **لم يتم العثور على مفتاح API للمزوّد بعد إضافة وكيل جديد**

    هذا يعني عادةً أن **الوكيل الجديد** لديه مخزن مصادقة فارغ. تكون المصادقة لكل وكيل
    ومخزنة في:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    خيارات الحل:

    - شغّل `openclaw agents add <id>` وقم بتكوين المصادقة أثناء المعالج.
    - أو انسخ `auth-profiles.json` من `agentDir` الخاص بالوكيل الرئيسي إلى `agentDir` الخاص بالوكيل الجديد.

    لا **تعِد** استخدام `agentDir` عبر عدة وكلاء؛ فهذا يسبب تعارضات في المصادقة/الجلسات.

  </Accordion>
</AccordionGroup>

## احتياط النموذج و"All models failed"

<AccordionGroup>
  <Accordion title="كيف يعمل الاحتياط؟">
    يحدث الاحتياط على مرحلتين:

    1. **تدوير ملف تعريف المصادقة** داخل المزوّد نفسه.
    2. **الاحتياط إلى نموذج آخر** في `agents.defaults.model.fallbacks`.

    تُطبَّق فترات تهدئة على ملفات التعريف التي تفشل (تراجع أسي)، بحيث يمكن لـ OpenClaw الاستمرار في الرد حتى عندما يكون المزوّد مقيّد المعدل أو متعطلًا مؤقتًا.

    تتضمن سلة حدود المعدل أكثر من مجرد استجابات `429` العادية. كما يعامل OpenClaw
    رسائل مثل `Too many concurrent requests`،
    و`ThrottlingException`، و`concurrency limit reached`،
    و`workers_ai ... quota limit exceeded`، و`resource exhausted`، وحدود
    نوافذ الاستخدام الدورية (`weekly/monthly limit reached`) على أنها حدود
    معدل تستحق الاحتياط.

    بعض الاستجابات التي تبدو متعلقة بالفوترة ليست `402`، كما أن بعض استجابات HTTP `402`
    تبقى أيضًا ضمن تلك السلة العابرة. وإذا أعاد مزوّد ما
    نصًا صريحًا متعلقًا بالفوترة على `401` أو `403`، فلا يزال OpenClaw قادرًا على إبقاء ذلك في
    مسار الفوترة، لكن مطابِقات النصوص الخاصة بالمزوّد تبقى ضمن نطاق
    المزوّد الذي يملكها (مثل OpenRouter `Key limit exceeded`). وإذا بدت رسالة `402`
    بدلًا من ذلك كحد قابل لإعادة المحاولة ضمن نافذة الاستخدام أو
    حد إنفاق خاص بالمؤسسة/مساحة العمل (`daily limit reached, resets tomorrow`،
    `organization spending limit exceeded`)، فإن OpenClaw يعاملها على أنها
    `rate_limit`، وليس تعطيلًا طويلًا متعلقًا بالفوترة.

    أما أخطاء تجاوز السياق فهي مختلفة: فالتواقيع مثل
    `request_too_large`، أو `input exceeds the maximum number of tokens`،
    أو `input token count exceeds the maximum number of input tokens`،
    أو `input is too long for the model`، أو `ollama error: context length
    exceeded` تبقى ضمن مسار Compaction/إعادة المحاولة بدلًا من الانتقال إلى
    احتياط نموذج آخر.

    يكون نص خطأ الخادم العام أضيق عمدًا من "أي شيء يحتوي على
    unknown/error". يعامل OpenClaw بالفعل الأشكال العابرة الخاصة بالمزوّد
    مثل النص المجرد في Anthropic `An unknown error occurred`، أو النص المجرد في OpenRouter
    `Provider returned error`، أو أخطاء سبب التوقف مثل `Unhandled stop reason:
    error`، أو حمولات JSON من نوع `api_error` ذات النصوص العابرة الخاصة بالخادم
    (`internal server error`، أو `unknown error, 520`، أو `upstream error`، أو `backend
    error`)، وأخطاء انشغال المزوّد مثل `ModelNotReadyException` على أنها
    إشارات تستحق الاحتياط بسبب المهلة/التحميل الزائد عندما يطابق سياق المزوّد.
    أما النص العام للاحتياط الداخلي مثل `LLM request failed with an unknown
    error.` فيبقى محافظًا ولا يؤدي بمفرده إلى تشغيل احتياط نموذج آخر.

  </Accordion>

  <Accordion title='ما معنى "No credentials found for profile anthropic:default"؟'>
    هذا يعني أن النظام حاول استخدام معرّف ملف تعريف المصادقة `anthropic:default`، لكنه لم يتمكن من العثور على بيانات اعتماد له في مخزن المصادقة المتوقع.

    **قائمة التحقق من الحل:**

    - **أكّد مكان وجود ملفات تعريف المصادقة** (المسارات الجديدة مقابل القديمة)
      - الحالي: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - القديم: `~/.openclaw/agent/*` (يتم ترحيله بواسطة `openclaw doctor`)
    - **أكّد أن متغير env الخاص بك محمّل في Gateway**
      - إذا ضبطت `ANTHROPIC_API_KEY` في shell الخاص بك لكنك تشغّل Gateway عبر systemd/launchd، فقد لا يرثه. ضعه في `~/.openclaw/.env` أو فعّل `env.shellEnv`.
    - **تأكد من أنك تعدل الوكيل الصحيح**
      - تعني إعدادات الوكلاء المتعددين إمكانية وجود عدة ملفات `auth-profiles.json`.
    - **تحقق سريعًا من حالة النموذج/المصادقة**
      - استخدم `openclaw models status` لرؤية النماذج المكوّنة وما إذا كانت المزوّدات مصادقًا عليها.

    **قائمة التحقق من الحل لـ "No credentials found for profile anthropic"**

    هذا يعني أن التشغيل مثبّت على ملف تعريف مصادقة Anthropic، لكن Gateway
    لا يستطيع العثور عليه في مخزن المصادقة الخاص به.

    - **استخدم Claude CLI**
      - شغّل `openclaw models auth login --provider anthropic --method cli --set-default` على مضيف Gateway.
    - **إذا كنت تريد استخدام مفتاح API بدلًا من ذلك**
      - ضع `ANTHROPIC_API_KEY` في `~/.openclaw/.env` على **مضيف Gateway**.
      - امسح أي ترتيب مثبت يفرض ملف تعريف مفقودًا:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **أكّد أنك تشغّل الأوامر على مضيف Gateway**
      - في الوضع البعيد، تعيش ملفات تعريف المصادقة على جهاز Gateway، وليس على حاسوبك المحمول.

  </Accordion>

  <Accordion title="لماذا حاول أيضًا استخدام Google Gemini وفشل؟">
    إذا كان تكوين النموذج لديك يتضمن Google Gemini كاحتياط (أو إذا بدّلت إلى اختصار Gemini)، فسيحاول OpenClaw استخدامه أثناء احتياط النموذج. وإذا لم تكن قد كوّنت بيانات اعتماد Google، فسترى `No API key found for provider "google"`.

    الحل: إما توفير مصادقة Google، أو إزالة/تجنب نماذج Google في `agents.defaults.model.fallbacks` / الأسماء المستعارة حتى لا يوجّه الاحتياط إليها.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    السبب: يحتوي سجل الجلسة على **كتل thinking بلا تواقيع** (وغالبًا ما تأتي من
    بث متوقف/جزئي). ويتطلب Google Antigravity وجود تواقيع لكتل thinking.

    الحل: يقوم OpenClaw الآن بإزالة كتل thinking غير الموقعة الخاصة بـ Google Antigravity Claude. وإذا استمرت المشكلة في الظهور، فابدأ **جلسة جديدة** أو اضبط `/thinking off` لذلك الوكيل.

  </Accordion>
</AccordionGroup>

## ملفات تعريف المصادقة: ما هي وكيفية إدارتها

ذو صلة: [/concepts/oauth](/ar/concepts/oauth) (تدفقات OAuth، وتخزين الرموز المميزة، وأنماط الحسابات المتعددة)

<AccordionGroup>
  <Accordion title="ما هو ملف تعريف المصادقة؟">
    ملف تعريف المصادقة هو سجل بيانات اعتماد مسمى (OAuth أو مفتاح API) مرتبط بمزوّد. وتعيش ملفات التعريف في:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="ما هي معرّفات ملفات التعريف المعتادة؟">
    يستخدم OpenClaw معرّفات مسبوقة بالمزوّد مثل:

    - `anthropic:default` (شائع عندما لا توجد هوية بريد إلكتروني)
    - `anthropic:<email>` لهويات OAuth
    - معرّفات مخصصة تختارها أنت (مثل `anthropic:work`)

  </Accordion>

  <Accordion title="هل يمكنني التحكم في ملف تعريف المصادقة الذي تتم تجربته أولًا؟">
    نعم. يدعم التكوين بيانات وصفية اختيارية لملفات التعريف وترتيبًا لكل مزوّد (`auth.order.<provider>`). وهذا **لا** يخزن الأسرار؛ بل يربط المعرّفات بالمزوّد/الوضع ويضبط ترتيب التدوير.

    قد يتخطى OpenClaw مؤقتًا ملف تعريف إذا كان ضمن **فترة تهدئة** قصيرة (حدود معدل/مهلات/إخفاقات مصادقة) أو حالة **تعطيل** أطول (فواتير/رصيد غير كافٍ). لفحص ذلك، شغّل `openclaw models status --json` وافحص `auth.unusableProfiles`. الضبط: `auth.cooldowns.billingBackoffHours*`.

    يمكن أن تكون فترات تهدئة حدود المعدل ضمن نطاق النموذج. فملف التعريف الذي يدخل في تهدئة
    لنموذج واحد يمكن أن يظل صالحًا لنموذج شقيق على المزوّد نفسه،
    بينما تظل نوافذ الفوترة/التعطيل تحظر ملف التعريف بأكمله.

    يمكنك أيضًا ضبط تجاوز **لكل وكيل** للترتيب (يُخزَّن في `auth-state.json` لذلك الوكيل) عبر CLI:

    ```bash
    # الافتراضي هو الوكيل الافتراضي المكوّن (احذف --agent)
    openclaw models auth order get --provider anthropic

    # اقفل التدوير على ملف تعريف واحد (جرّب هذا فقط)
    openclaw models auth order set --provider anthropic anthropic:default

    # أو اضبط ترتيبًا صريحًا (احتياط داخل المزوّد)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # امسح التجاوز (الرجوع إلى config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    لاستهداف وكيل محدد:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    وللتحقق مما سيتم تجربته فعليًا، استخدم:

    ```bash
    openclaw models status --probe
    ```

    إذا تم حذف ملف تعريف مخزن من الترتيب الصريح، فإن probe يبلغ
    `excluded_by_auth_order` لذلك الملف بدلًا من تجربته بصمت.

  </Accordion>

  <Accordion title="OAuth مقابل مفتاح API - ما الفرق؟">
    يدعم OpenClaw كليهما:

    - **OAuth** غالبًا ما يستفيد من وصول الاشتراك (عندما يكون ذلك قابلًا للتطبيق).
    - **مفاتيح API** تستخدم فوترة الدفع لكل رمز.

    يدعم المعالج صراحةً Anthropic Claude CLI وOpenAI Codex OAuth ومفاتيح API.

  </Accordion>
</AccordionGroup>

## ذو صلة

- [الأسئلة الشائعة](/ar/help/faq) — الأسئلة الشائعة الرئيسية
- [الأسئلة الشائعة — البدء السريع والإعداد عند التشغيل الأول](/ar/help/faq-first-run)
- [اختيار النموذج](/ar/concepts/model-providers)
- [احتياط النموذج](/ar/concepts/model-failover)
