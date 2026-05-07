---
read_when:
    - اختيار النماذج أو التبديل بينها، وتكوين الأسماء المستعارة
    - تصحيح أخطاء التحويل عند فشل النموذج / "فشلت جميع النماذج"
    - فهم ملفات تعريف المصادقة وكيفية إدارتها
sidebarTitle: Models FAQ
summary: 'الأسئلة الشائعة: الإعدادات الافتراضية للنماذج، والاختيار، والأسماء المستعارة، والتبديل، وتجاوز الفشل، وملفات تعريف المصادقة'
title: 'الأسئلة الشائعة: النماذج والمصادقة'
x-i18n:
    generated_at: "2026-05-07T13:20:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: fec3256990c91d30e1241554ceafeb23ba0eb9b858cd028d64c9cd0631e67f34
    source_path: help/faq-models.md
    workflow: 16
---

  سؤال وجواب حول النموذج وملف تعريف المصادقة. للإعداد والجلسات وGateway والقنوات واستكشاف الأخطاء وإصلاحها، راجع [الأسئلة الشائعة](/ar/help/faq) الرئيسية.

  ## النماذج: الإعدادات الافتراضية، الاختيار، الأسماء المستعارة، التبديل

  <AccordionGroup>
  <Accordion title='ما هو "النموذج الافتراضي"؟'>
    النموذج الافتراضي في OpenClaw هو أي نموذج تضبطه كالتالي:

    ```
    agents.defaults.model.primary
    ```

    تتم الإشارة إلى النماذج بصيغة `provider/model` (مثال: `openai/gpt-5.5` أو `anthropic/claude-sonnet-4-6`). إذا حذفت المزوّد، يحاول OpenClaw أولاً استخدام اسم مستعار، ثم مطابقة مزوّد مكوّن فريد لمعرّف النموذج الدقيق هذا، وبعد ذلك فقط يرجع إلى المزوّد الافتراضي المكوّن كمسار توافق قديم. إذا لم يعد ذلك المزوّد يوفّر النموذج الافتراضي المكوّن، يرجع OpenClaw إلى أول مزوّد/نموذج مكوّن بدلاً من إظهار إعداد افتراضي قديم لمزوّد تمت إزالته. مع ذلك، ينبغي لك ضبط `provider/model` **صراحةً**.

  </Accordion>

  <Accordion title="ما النموذج الذي تنصح به؟">
    **الإعداد الافتراضي الموصى به:** استخدم أقوى نموذج من أحدث جيل متاح في مجموعة مزوّديك.
    **للوكلاء المفعّلين بالأدوات أو ذوي الإدخال غير الموثوق:** أعطِ الأولوية لقوة النموذج على التكلفة.
    **للمحادثات الروتينية/منخفضة المخاطر:** استخدم نماذج احتياطية أرخص ووجّه حسب دور الوكيل.

    لدى MiniMax وثائقه الخاصة: [MiniMax](/ar/providers/minimax) و
    [النماذج المحلية](/ar/gateway/local-models).

    القاعدة العامة: استخدم **أفضل نموذج يمكنك تحمل تكلفته** للأعمال عالية المخاطر، ونموذجاً أرخص
    للمحادثات أو الملخصات الروتينية. يمكنك توجيه النماذج لكل وكيل واستخدام الوكلاء الفرعيين
    لموازاة المهام الطويلة (يستهلك كل وكيل فرعي رموزاً). راجع [النماذج](/ar/concepts/models) و
    [الوكلاء الفرعيون](/ar/tools/subagents).

    تحذير مهم: النماذج الأضعف/المكمّمة بإفراط أكثر عرضة لحقن التعليمات
    والسلوك غير الآمن. راجع [الأمان](/ar/gateway/security).

    مزيد من السياق: [النماذج](/ar/concepts/models).

  </Accordion>

  <Accordion title="كيف أبدّل النماذج دون مسح إعدادي؟">
    استخدم **أوامر النموذج** أو عدّل حقول **النموذج** فقط. تجنّب استبدال الإعداد بالكامل.

    خيارات آمنة:

    - `/model` في المحادثة (سريع، لكل جلسة)
    - `openclaw models set ...` (يحدّث إعداد النموذج فقط)
    - `openclaw configure --section model` (تفاعلي)
    - عدّل `agents.defaults.model` في `~/.openclaw/openclaw.json`

    تجنّب `config.apply` مع كائن جزئي ما لم تكن تقصد استبدال الإعداد بالكامل.
    لتعديلات RPC، افحص أولاً باستخدام `config.schema.lookup` وفضّل `config.patch`. تمنحك حمولة البحث المسار المطبع، ووثائق/قيود المخطط السطحية، وملخصات الأبناء المباشرين.
    للتحديثات الجزئية.
    إذا كنت قد كتبت فوق الإعداد، فاستعده من نسخة احتياطية أو أعد تشغيل `openclaw doctor` للإصلاح.

    الوثائق: [النماذج](/ar/concepts/models)، [التهيئة](/ar/cli/configure)، [الإعداد](/ar/cli/config)، [Doctor](/ar/gateway/doctor).

  </Accordion>

  <Accordion title="هل يمكنني استخدام نماذج مستضافة ذاتياً (llama.cpp، vLLM، Ollama)؟">
    نعم. Ollama هو أسهل مسار للنماذج المحلية.

    أسرع إعداد:

    1. ثبّت Ollama من `https://ollama.com/download`
    2. اسحب نموذجاً محلياً مثل `ollama pull gemma4`
    3. إذا كنت تريد نماذج سحابية أيضاً، شغّل `ollama signin`
    4. شغّل `openclaw onboard` واختر `Ollama`
    5. اختر `Local` أو `Cloud + Local`

    ملاحظات:

    - يمنحك `Cloud + Local` نماذج سحابية بالإضافة إلى نماذج Ollama المحلية لديك
    - النماذج السحابية مثل `kimi-k2.5:cloud` لا تحتاج إلى سحب محلي
    - للتبديل اليدوي، استخدم `openclaw models list` و`openclaw models set ollama/<model>`

    ملاحظة أمان: النماذج الأصغر أو المكمّمة بشدة أكثر عرضة لحقن التعليمات.
    نوصي بشدة باستخدام **نماذج كبيرة** لأي بوت يمكنه استخدام الأدوات.
    إذا كنت لا تزال تريد نماذج صغيرة، ففعّل العزل وقوائم السماح الصارمة للأدوات.

    الوثائق: [Ollama](/ar/providers/ollama)، [النماذج المحلية](/ar/gateway/local-models)،
    [مزوّدو النماذج](/ar/concepts/model-providers)، [الأمان](/ar/gateway/security)،
    [العزل](/ar/gateway/sandboxing).

  </Accordion>

  <Accordion title="ما النماذج التي يستخدمها OpenClaw وFlawd وKrill؟">
    - قد تختلف هذه عمليات النشر وقد تتغير بمرور الوقت؛ لا توجد توصية ثابتة لمزوّد.
    - تحقق من إعداد وقت التشغيل الحالي على كل Gateway باستخدام `openclaw models status`.
    - للوكلاء الحسّاسين أمنياً/المفعّلين بالأدوات، استخدم أقوى نموذج من أحدث جيل متاح.

  </Accordion>

  <Accordion title="كيف أبدّل النماذج فورياً (دون إعادة التشغيل)؟">
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

    هذه هي الأسماء المستعارة المدمجة. يمكن إضافة أسماء مستعارة مخصصة عبر `agents.defaults.models`.

    يمكنك سرد النماذج المتاحة باستخدام `/model` أو `/model list` أو `/model status`.

    يعرض `/model` (و`/model list`) منتقياً مدمجاً مرقماً. اختر بالرقم:

    ```
    /model 3
    ```

    يمكنك أيضاً فرض ملف تعريف مصادقة محدد للمزوّد (لكل جلسة):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    نصيحة: يعرض `/model status` أي وكيل نشط، وأي ملف `auth-profiles.json` قيد الاستخدام، وأي ملف تعريف مصادقة ستتم تجربته تالياً.
    كما يعرض نقطة نهاية المزوّد المكوّنة (`baseUrl`) ووضع API (`api`) عند توفرهما.

    **كيف ألغي تثبيت ملف تعريف ضبطته باستخدام @profile؟**

    أعد تشغيل `/model` **دون** لاحقة `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    إذا كنت تريد العودة إلى الإعداد الافتراضي، فاختره من `/model` (أو أرسل `/model <default provider/model>`).
    استخدم `/model status` لتأكيد ملف تعريف المصادقة النشط.

  </Accordion>

  <Accordion title="هل يمكنني استخدام GPT 5.5 للمهام اليومية وCodex 5.5 للبرمجة؟">
    نعم. تعامل مع اختيار النموذج واختيار وقت التشغيل بشكل منفصل:

    - **وكيل البرمجة الأصلي Codex:** اضبط `agents.defaults.model.primary` على `openai/gpt-5.5`. سجّل الدخول باستخدام `openclaw models auth login --provider openai-codex` عندما تريد مصادقة اشتراك ChatGPT/Codex.
    - **مهام OpenAI API المباشرة خارج حلقة الوكيل:** هيّئ `OPENAI_API_KEY` للصور والتضمينات والكلام والوقت الحقيقي والأسطح الأخرى غير الوكيلة في OpenAI API.
    - **مصادقة مفتاح API لوكيل OpenAI:** استخدم `/model openai/gpt-5.5` مع ملف تعريف مفتاح API مرتّب لـ `openai-codex`.
    - **الوكلاء الفرعيون:** وجّه مهام البرمجة إلى وكيل Codex فقط بنموذجه الخاص وإعداد `agentRuntime` الافتراضي.

    راجع [النماذج](/ar/concepts/models) و[أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="كيف أهيّئ الوضع السريع لـ GPT 5.5؟">
    استخدم إما مفتاح تبديل للجلسة أو إعداداً افتراضياً في الإعداد:

    - **لكل جلسة:** أرسل `/fast on` أثناء استخدام الجلسة لـ `openai/gpt-5.5`.
    - **إعداد افتراضي لكل نموذج:** اضبط `agents.defaults.models["openai/gpt-5.5"].params.fastMode` على `true`.

    مثال:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    في OpenAI، يرتبط الوضع السريع بـ `service_tier = "priority"` في طلبات Responses الأصلية المدعومة. تتغلب تجاوزات `/fast` للجلسة على الإعدادات الافتراضية.

    راجع [التفكير والوضع السريع](/ar/tools/thinking) و[الوضع السريع في OpenAI](/ar/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='لماذا أرى "Model ... is not allowed" ثم لا أتلقى رداً؟'>
    إذا تم ضبط `agents.defaults.models`، فإنه يصبح **قائمة السماح** لـ `/model` وأي
    تجاوزات للجلسة. اختيار نموذج غير موجود في تلك القائمة يعيد:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    يُعاد ذلك الخطأ **بدلاً من** رد عادي. الإصلاح: أضف النموذج إلى
    `agents.defaults.models`، أو أزل قائمة السماح، أو اختر نموذجاً من `/model list`.
    إذا كان الأمر يتضمن أيضاً `--runtime codex`، فأضف النموذج أولاً ثم أعد محاولة
    الأمر نفسه `/model provider/model --runtime codex`.

  </Accordion>

  <Accordion title='لماذا أرى "Unknown model: minimax/MiniMax-M2.7"؟'>
    يعني هذا أن **المزوّد غير مهيأ** (لم يتم العثور على إعداد مزوّد MiniMax أو ملف تعريف
    مصادقة)، لذلك لا يمكن حل النموذج.

    قائمة الإصلاح:

    1. رقّ إلى إصدار OpenClaw حالي (أو شغّل من مصدر `main`)، ثم أعد تشغيل Gateway.
    2. تأكد من تهيئة MiniMax (المعالج أو JSON)، أو أن مصادقة MiniMax
       موجودة في env/ملفات تعريف المصادقة بحيث يمكن حقن المزوّد المطابق
       (`MINIMAX_API_KEY` لـ `minimax`، أو `MINIMAX_OAUTH_TOKEN` أو OAuth مخزّن لـ MiniMax
       من أجل `minimax-portal`).
    3. استخدم معرّف النموذج الدقيق (حساس لحالة الأحرف) لمسار المصادقة لديك:
       `minimax/MiniMax-M2.7` أو `minimax/MiniMax-M2.7-highspeed` لإعداد مفتاح API،
       أو `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` لإعداد OAuth.
    4. شغّل:

       ```bash
       openclaw models list
       ```

       واختر من القائمة (أو `/model list` في المحادثة).

    راجع [MiniMax](/ar/providers/minimax) و[النماذج](/ar/concepts/models).

  </Accordion>

  <Accordion title="هل يمكنني استخدام MiniMax كإعداد افتراضي وOpenAI للمهام المعقدة؟">
    نعم. استخدم **MiniMax كإعداد افتراضي** وبدّل النماذج **لكل جلسة** عند الحاجة.
    الاحتياطيات مخصصة **للأخطاء**، وليس "للمهام الصعبة"، لذلك استخدم `/model` أو وكيلاً منفصلاً.

    **الخيار أ: التبديل لكل جلسة**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.5": { alias: "gpt" },
          },
        },
      },
    }
    ```

    ثم:

    ```
    /model gpt
    ```

    **الخيار ب: وكلاء منفصلون**

    - الإعداد الافتراضي للوكيل A: MiniMax
    - الإعداد الافتراضي للوكيل B: OpenAI
    - وجّه حسب الوكيل أو استخدم `/agent` للتبديل

    الوثائق: [النماذج](/ar/concepts/models)، [توجيه الوكلاء المتعددين](/ar/concepts/multi-agent)، [MiniMax](/ar/providers/minimax)، [OpenAI](/ar/providers/openai).

  </Accordion>

  <Accordion title="هل opus / sonnet / gpt اختصارات مدمجة؟">
    نعم. يأتي OpenClaw مع بعض الاختصارات الافتراضية (تُطبّق فقط عندما يكون النموذج موجوداً في `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    إذا ضبطت اسماً مستعاراً خاصاً بك بالاسم نفسه، فستكون قيمتك هي المعتمدة.

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

    ثم يُحل `/model sonnet` (أو `/<alias>` عند دعمه) إلى معرّف النموذج ذلك.

  </Accordion>

  <Accordion title="كيف أضيف نماذج من مزوّدين آخرين مثل OpenRouter أو Z.AI؟">
    OpenRouter (الدفع لكل رمز؛ نماذج كثيرة):

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

    Z.AI (نماذج GLM):

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

    إذا أشرت إلى موفّر/نموذج لكن مفتاح الموفّر المطلوب مفقود، فستحصل على خطأ مصادقة وقت التشغيل (مثل `No API key found for provider "zai"`).

    **لم يُعثر على مفتاح API للموفّر بعد إضافة وكيل جديد**

    يعني هذا عادةً أن **الوكيل الجديد** لديه مخزن مصادقة فارغ. المصادقة خاصة بكل وكيل
    وتُخزَّن في:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    خيارات الإصلاح:

    - شغّل `openclaw agents add <id>` واضبط المصادقة أثناء المعالج.
    - أو انسخ فقط ملفات تعريف `api_key` / `token` الثابتة القابلة للنقل من مخزن مصادقة الوكيل الرئيسي إلى مخزن مصادقة الوكيل الجديد.
    - بالنسبة إلى ملفات تعريف OAuth، سجّل الدخول من الوكيل الجديد عندما يحتاج إلى حسابه الخاص؛ وإلا يستطيع OpenClaw القراءة عبر الوكيل الافتراضي/الرئيسي من دون نسخ رموز التحديث.

    لا **تُعِد استخدام** `agentDir` بين الوكلاء؛ فهذا يسبب تضاربًا في المصادقة/الجلسات.

  </Accordion>
</AccordionGroup>

## تجاوز فشل النماذج و"فشلت كل النماذج"

<AccordionGroup>
  <Accordion title="كيف يعمل تجاوز الفشل؟">
    يحدث تجاوز الفشل على مرحلتين:

    1. **تدوير ملف تعريف المصادقة** ضمن الموفّر نفسه.
    2. **الرجوع إلى نموذج بديل** وهو النموذج التالي في `agents.defaults.model.fallbacks`.

    تُطبَّق فترات تهدئة على ملفات التعريف الفاشلة (تراجع أُسّي)، لذلك يمكن أن يستمر OpenClaw في الاستجابة حتى عندما يكون الموفّر محدود المعدّل أو يفشل مؤقتًا.

    يتضمن وعاء تحديد المعدّل أكثر من استجابات `429` البسيطة. يتعامل OpenClaw
    أيضًا مع رسائل مثل `Too many concurrent requests`،
    و`ThrottlingException`، و`concurrency limit reached`،
    و`workers_ai ... quota limit exceeded`، و`resource exhausted`، وحدود
    نوافذ الاستخدام الدورية (`weekly/monthly limit reached`) على أنها حدود معدّل
    تستحق تجاوز الفشل.

    بعض الاستجابات التي تبدو متعلقة بالفوترة ليست `402`، وبعض استجابات HTTP `402`
    تبقى أيضًا في ذلك الوعاء العابر. إذا أعاد موفّر نص فوترة صريحًا مع `401` أو `403`،
    فلا يزال OpenClaw قادرًا على إبقاء ذلك في مسار الفوترة، لكن مطابِقات النص الخاصة بالموفّر تبقى محصورة في
    الموفّر الذي يملكها (على سبيل المثال OpenRouter `Key limit exceeded`). وإذا بدت رسالة `402`
    بدلًا من ذلك كنافذة استخدام قابلة لإعادة المحاولة أو
    حد إنفاق مؤسسة/مساحة عمل (`daily limit reached, resets tomorrow`،
    `organization spending limit exceeded`)، فيتعامل معها OpenClaw على أنها
    `rate_limit`، وليس تعطيل فوترة طويل الأمد.

    أخطاء فيض السياق مختلفة: تبقى تواقيع مثل
    `request_too_large`، و`input exceeds the maximum number of tokens`،
    و`input token count exceeds the maximum number of input tokens`،
    و`input is too long for the model`، أو `ollama error: context length
    exceeded` على مسار Compaction/إعادة المحاولة بدلًا من التقدم إلى
    الرجوع إلى نموذج بديل.

    نص أخطاء الخادم العام أضيق قصدًا من "أي شيء يحتوي
    على unknown/error". يتعامل OpenClaw بالفعل مع أشكال عابرة ضمن نطاق الموفّر
    مثل خطأ Anthropic العاري `An unknown error occurred`، وخطأ OpenRouter العاري
    `Provider returned error`، وأخطاء سبب التوقف مثل `Unhandled stop reason:
    error`، وحمولات JSON من نوع `api_error` التي تحتوي على نص خادم عابر
    (`internal server error`، و`unknown error, 520`، و`upstream error`، و`backend
    error`)، وأخطاء انشغال الموفّر مثل `ModelNotReadyException` على أنها
    إشارات مهلة/تحميل زائد تستحق تجاوز الفشل عندما يتطابق سياق الموفّر.
    أما نص الرجوع الداخلي العام مثل `LLM request failed with an unknown
    error.` فيبقى محافظًا ولا يفعّل الرجوع إلى نموذج بديل بحد ذاته.

  </Accordion>

  <Accordion title='ماذا يعني "No credentials found for profile anthropic:default"؟'>
    يعني ذلك أن النظام حاول استخدام معرّف ملف تعريف المصادقة `anthropic:default`، لكنه لم يتمكن من العثور على بيانات الاعتماد الخاصة به في مخزن المصادقة المتوقع.

    **قائمة تحقق للإصلاح:**

    - **تأكد من مكان وجود ملفات تعريف المصادقة** (المسارات الجديدة مقابل القديمة)
      - الحالي: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - القديم: `~/.openclaw/agent/*` (يرحّله `openclaw doctor`)
    - **تأكد من أن متغير البيئة لديك يحمّله Gateway**
      - إذا عيّنت `ANTHROPIC_API_KEY` في الصدفة لديك لكنك تشغّل Gateway عبر systemd/launchd، فقد لا يرثه. ضعه في `~/.openclaw/.env` أو فعّل `env.shellEnv`.
    - **تأكد من أنك تعدّل الوكيل الصحيح**
      - تعني إعدادات الوكلاء المتعددين أنه قد تكون هناك عدة ملفات `auth-profiles.json`.
    - **تحقق مبدئيًا من حالة النموذج/المصادقة**
      - استخدم `openclaw models status` لرؤية النماذج المضبوطة وما إذا كان الموفّرون مصادقين.

    **قائمة تحقق لإصلاح "No credentials found for profile anthropic"**

    يعني هذا أن التشغيل مثبّت على ملف تعريف مصادقة Anthropic، لكن Gateway
    لا يستطيع العثور عليه في مخزن المصادقة لديه.

    - **استخدم Claude CLI**
      - شغّل `openclaw models auth login --provider anthropic --method cli --set-default` على مضيف Gateway.
    - **إذا كنت تريد استخدام مفتاح API بدلًا من ذلك**
      - ضع `ANTHROPIC_API_KEY` في `~/.openclaw/.env` على **مضيف Gateway**.
      - امسح أي ترتيب مثبّت يفرض ملف تعريف مفقودًا:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **تأكد من أنك تشغّل الأوامر على مضيف Gateway**
      - في الوضع البعيد، تعيش ملفات تعريف المصادقة على جهاز Gateway، لا على حاسوبك المحمول.

  </Accordion>

  <Accordion title="لماذا حاول أيضًا استخدام Google Gemini وفشل؟">
    إذا كان ضبط نموذجك يتضمن Google Gemini كبديل احتياطي (أو بدّلت إلى اختصار Gemini)، فسيحاول OpenClaw استخدامه أثناء الرجوع إلى نموذج بديل. إذا لم تضبط بيانات اعتماد Google، فسترى `No API key found for provider "google"`.

    الإصلاح: إما وفّر مصادقة Google، أو أزل/تجنب نماذج Google في `agents.defaults.model.fallbacks` / الأسماء المستعارة حتى لا يوجّه الرجوع إليها.

    **رُفض طلب LLM: توقيع التفكير مطلوب (Google Antigravity)**

    السبب: يحتوي سجل الجلسة على **كتل تفكير بلا تواقيع** (غالبًا من
    تدفق أُجهض/جزئي). يتطلب Google Antigravity تواقيع لكتل التفكير.

    الإصلاح: يزيل OpenClaw الآن كتل التفكير غير الموقعة لـ Google Antigravity Claude. إذا ظل يظهر، فابدأ **جلسة جديدة** أو عيّن `/thinking off` لذلك الوكيل.

  </Accordion>
</AccordionGroup>

## ملفات تعريف المصادقة: ما هي وكيف تديرها

ذو صلة: [/concepts/oauth](/ar/concepts/oauth) (تدفقات OAuth، تخزين الرموز، أنماط الحسابات المتعددة)

<AccordionGroup>
  <Accordion title="ما ملف تعريف المصادقة؟">
    ملف تعريف المصادقة هو سجل بيانات اعتماد مسمّى (OAuth أو مفتاح API) مرتبط بموفّر. توجد ملفات التعريف في:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    لفحص ملفات التعريف المحفوظة من دون كشف الأسرار، شغّل `openclaw models auth list` (اختياريًا `--provider <id>` أو `--json`). راجع [Models CLI](/ar/cli/models#auth-profiles) للتفاصيل.

  </Accordion>

  <Accordion title="ما معرّفات ملفات التعريف المعتادة؟">
    يستخدم OpenClaw معرّفات مسبوقة بالموفّر مثل:

    - `anthropic:default` (شائع عندما لا توجد هوية بريد إلكتروني)
    - `anthropic:<email>` لهويات OAuth
    - معرّفات مخصصة تختارها (مثل `anthropic:work`)

  </Accordion>

  <Accordion title="هل يمكنني التحكم في ملف تعريف المصادقة الذي يُجرّب أولًا؟">
    نعم. يدعم الضبط بيانات وصفية اختيارية لملفات التعريف وترتيبًا لكل موفّر (`auth.order.<provider>`). هذا لا **يخزّن** الأسرار؛ بل يربط المعرّفات بالموفّر/النمط ويعيّن ترتيب التدوير.

    قد يتخطى OpenClaw ملف تعريف مؤقتًا إذا كان في **فترة تهدئة** قصيرة (حدود المعدّل/المهل/إخفاقات المصادقة) أو في حالة **معطّل** أطول (فوترة/أرصدة غير كافية). لفحص ذلك، شغّل `openclaw models status --json` وتحقق من `auth.unusableProfiles`. الضبط الدقيق: `auth.cooldowns.billingBackoffHours*`.

    يمكن أن تكون فترات تهدئة حدود المعدّل محددة النطاق بالنموذج. ملف تعريف يمر بفترة تهدئة
    لنموذج واحد قد يظل صالحًا للاستخدام مع نموذج شقيق لدى الموفّر نفسه،
    بينما تظل نوافذ الفوترة/التعطيل تحظر ملف التعريف كاملًا.

    يمكنك أيضًا تعيين تجاوز ترتيب **لكل وكيل** (مخزّن في `auth-state.json` لذلك الوكيل) عبر CLI:

    ```bash
    # Defaults to the configured default agent (omit --agent)
    openclaw models auth order get --provider anthropic

    # Lock rotation to a single profile (only try this one)
    openclaw models auth order set --provider anthropic anthropic:default

    # Or set an explicit order (fallback within provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Clear override (fall back to config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    لاستهداف وكيل محدد:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    للتحقق مما ستتم تجربته فعليًا، استخدم:

    ```bash
    openclaw models status --probe
    ```

    إذا حُذف ملف تعريف مخزّن من الترتيب الصريح، فسيبلّغ الفحص
    عن `excluded_by_auth_order` لذلك الملف بدلًا من تجربته بصمت.

  </Accordion>

  <Accordion title="OAuth مقابل مفتاح API - ما الفرق؟">
    يدعم OpenClaw كليهما:

    - **OAuth** غالبًا ما يستفيد من وصول الاشتراك (عند انطباق ذلك).
    - **مفاتيح API** تستخدم فوترة حسب الرمز.

    يدعم المعالج صراحةً Anthropic Claude CLI، وOpenAI Codex OAuth، ومفاتيح API.

  </Accordion>
</AccordionGroup>

## ذو صلة

- [الأسئلة الشائعة](/ar/help/faq) — الأسئلة الشائعة الرئيسية
- [الأسئلة الشائعة — البدء السريع وإعداد التشغيل الأول](/ar/help/faq-first-run)
- [اختيار النموذج](/ar/concepts/model-providers)
- [تجاوز فشل النماذج](/ar/concepts/model-failover)
