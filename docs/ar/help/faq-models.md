---
read_when:
    - اختيار النماذج أو التبديل بينها، وتكوين الأسماء المستعارة
    - تصحيح أخطاء تجاوز فشل النموذج / «فشلت جميع النماذج»
    - فهم ملفات تعريف المصادقة وكيفية إدارتها
sidebarTitle: Models FAQ
summary: 'الأسئلة الشائعة: إعدادات النماذج الافتراضية، والاختيار، والأسماء المستعارة، والتبديل، والتجاوز عند الفشل، وملفات تعريف المصادقة'
title: 'الأسئلة الشائعة: النماذج والمصادقة'
x-i18n:
    generated_at: "2026-07-12T05:57:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 071e89c01120849179d3bc372153eb2c76a0fa4e93846df42920f0d961d597df
    source_path: help/faq-models.md
    workflow: 16
---

  أسئلة وأجوبة حول النماذج وملفات تعريف المصادقة. لإعداد النظام والجلسات وGateway والقنوات واستكشاف الأخطاء وإصلاحها، راجع [الأسئلة الشائعة](/ar/help/faq) الرئيسية.

  ## النماذج: الإعدادات الافتراضية والاختيار والأسماء المستعارة والتبديل

  <AccordionGroup>
  <Accordion title='What is the "default model"?'>
    يُضبط باستخدام:

    ```text
    agents.defaults.model.primary
    ```

    النماذج هي مراجع بصيغة `provider/model` (مثال: `openai/gpt-5.5`،
    `anthropic/claude-sonnet-4-6`). عيّن دائمًا `provider/model` صراحةً. إذا
    حذفت المزوّد، يحاول OpenClaw أولًا مطابقة اسم مستعار، ثم مطابقة مزوّد
    مُهيأ وفريد لمعرّف النموذج، ثم يعود إلى المزوّد الافتراضي
    المُهيأ (مسار توافق مهمل). إذا لم يعد ذلك المزوّد يتضمن النموذج الافتراضي
    المُهيأ، يعود OpenClaw إلى أول مزوّد/نموذج مُهيأ بدلًا من استخدام إعداد
    افتراضي قديم.

  </Accordion>

  <Accordion title="What model do you recommend?">
    استخدم أقوى نموذج من أحدث جيل توفره مجموعة مزوّديك،
    خصوصًا للوكلاء الذين يستخدمون الأدوات أو يتعاملون مع مدخلات غير موثوقة؛
    فالنماذج الأضعف أو المفرطة في التكميم أكثر عرضة لحقن الموجّهات والسلوك
    غير الآمن (راجع [الأمان](/ar/gateway/security)). وجّه النماذج الأقل تكلفة إلى
    المحادثات الروتينية أو منخفضة المخاطر وفقًا لدور الوكيل.

    وجّه النماذج لكل وكيل واستخدم الوكلاء الفرعيين لتنفيذ المهام الطويلة
    بالتوازي (يستهلك كل وكيل فرعي رموزه الخاصة). راجع
    [النماذج](/ar/concepts/models)، و[الوكلاء الفرعيين](/ar/tools/subagents)،
    و[MiniMax](/ar/providers/minimax)، و[النماذج المحلية](/ar/gateway/local-models).

  </Accordion>

  <Accordion title="How do I switch models without wiping my config?">
    غيّر حقول النموذج فقط، وتجنب استبدال الإعدادات بالكامل.

    - `/model` في المحادثة (لكل جلسة، راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands))
    - `openclaw models set ...` (يحدّث إعدادات النموذج فقط)
    - `openclaw configure --section model` (تفاعلي)
    - عدّل `agents.defaults.model` مباشرةً في `~/.openclaw/openclaw.json`

    بالنسبة إلى تعديلات RPC، افحص أولًا باستخدام `config.schema.lookup`
    (المسار الموحّد، ووثائق المخطط السطحية، وملخصات العناصر الفرعية)، ثم فضّل
    `config.patch` على `config.apply` مع كائن جزئي. إذا كنت قد استبدلت
    الإعدادات بالفعل، فاستعدها من النسخة الاحتياطية أو شغّل `openclaw doctor`
    لإصلاحها.

    الوثائق: [النماذج](/ar/concepts/models)، و[التهيئة](/ar/cli/configure)،
    و[الإعدادات](/ar/cli/config)، و[Doctor](/ar/gateway/doctor).

  </Accordion>

  <Accordion title="Can I use self-hosted models (llama.cpp, vLLM, Ollama)?">
    نعم، Ollama هو المسار الأسهل. إعداد سريع:

    1. ثبّت Ollama من `https://ollama.com/download`
    2. نزّل نموذجًا محليًا، مثل `ollama pull gemma4`
    3. لاستخدام النماذج السحابية أيضًا، شغّل `ollama signin`
    4. شغّل `openclaw onboard`، واختر `Ollama`، ثم `Local` أو `Cloud + Local`

    يمنحك `Cloud + Local` النماذج السحابية إلى جانب نماذج Ollama المحلية؛
    ولا تحتاج النماذج السحابية مثل `kimi-k2.5:cloud` إلى تنزيل محلي. للتبديل
    يدويًا: `openclaw models list`، ثم `openclaw models set ollama/<model>`.

    النماذج الأصغر أو شديدة التكميم أكثر عرضة لحقن الموجّهات.
    استخدم نماذج كبيرة لأي روبوت لديه صلاحية الوصول إلى الأدوات؛ وإذا استخدمت
    نماذج صغيرة رغم ذلك، ففعّل العزل وقوائم السماح الصارمة للأدوات.

    الوثائق: [Ollama](/ar/providers/ollama)، و[النماذج المحلية](/ar/gateway/local-models)،
    و[مزوّدو النماذج](/ar/concepts/model-providers)، و[الأمان](/ar/gateway/security)،
    و[العزل](/ar/gateway/sandboxing).

  </Accordion>

  <Accordion title="How do I switch models on the fly (without restarting)?">
    أرسل `/model <name>` كرسالة مستقلة. راجع
    [أوامر الشرطة المائلة](/ar/tools/slash-commands) للاطلاع على
    قائمة الأوامر الكاملة، بما فيها أداة الاختيار المرقمة (`/model`، و`/model
    list`، و`/model 3`)، والأمر `/model default` لمسح تجاوز الجلسة، والأمر
    `/model status` لعرض تفاصيل نقطة النهاية/وضع API.

    افرض ملف تعريف مصادقة محددًا لكل جلسة باستخدام `@profile`:

    ```text
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    لإلغاء تثبيت ملف تعريف ضُبط باستخدام `@profile`، أعد تشغيل `/model` من دون
    اللاحقة (مثل `/model anthropic/claude-opus-4-6`)، أو اختر الإعداد الافتراضي من
    `/model`. استخدم `/model status` للتأكد من ملف تعريف المصادقة النشط.

  </Accordion>

  <Accordion title="If two providers expose the same model id, which one does /model use?">
    يحدد `/model provider/model` مسار ذلك المزوّد بالضبط. على سبيل المثال،
    يُعد `qianfan/deepseek-v4-flash` و`deepseek/deepseek-v4-flash` مرجعين
    مختلفين رغم تطابق معرّف النموذج؛ ولا يبدّل OpenClaw المزوّدين بصمت
    عند مطابقة معرّف مجرد.

    يكون مرجع `/model` الذي اختاره المستخدم صارمًا عند الرجوع الاحتياطي: إذا أصبح
    ذلك المزوّد/النموذج غير متاح، يفشل الرد بشكل ظاهر بدلًا من
    الرجوع إلى `agents.defaults.model.fallbacks`. تظل سلاسل الرجوع الاحتياطي
    المُهيأة مطبقة على الإعدادات الافتراضية المُهيأة، والنماذج الأساسية لمهام
    Cron، وحالة الرجوع الاحتياطي المحددة تلقائيًا. عندما يُسمح لتشغيل لا يستخدم
    تجاوزًا خاصًا بالجلسة بالرجوع الاحتياطي، يحاول OpenClaw أولًا
    المزوّد/النموذج المطلوب، ثم البدائل المُهيأة، ثم النموذج الأساسي المُهيأ؛
    ولذلك لا تقفز معرّفات النماذج المجردة المتكررة مباشرةً إلى المزوّد الافتراضي.

    راجع [النماذج](/ar/concepts/models) و[تجاوز فشل النموذج](/ar/concepts/model-failover).

  </Accordion>

  <Accordion title="Can I use GPT 5.5 for daily tasks and Codex 5.5 for coding?">
    نعم، اختيار النموذج واختيار بيئة التشغيل أمران منفصلان:

    - **وكيل البرمجة الأصلي Codex:** عيّن `agents.defaults.model.primary` إلى
      `openai/gpt-5.5`. سجّل الدخول باستخدام `openclaw models auth login --provider
      openai` لمصادقة اشتراك ChatGPT/Codex.
    - **مهام OpenAI API المباشرة خارج حلقة الوكيل:** هيّئ
      `OPENAI_API_KEY` للصور والتضمينات والكلام والوقت الفعلي وغيرها من
      واجهات OpenAI API غير الخاصة بالوكيل.
    - **مصادقة وكيل OpenAI باستخدام مفتاح API:** استخدم `/model openai/gpt-5.5`
      مع ملف تعريف مفتاح API مرتب تابع لـ`openai`.
    - **الوكلاء الفرعيون:** وجّه مهام البرمجة إلى وكيل يركز على Codex وله
      نموذج `openai/gpt-5.5` خاص به.

    راجع [النماذج](/ar/concepts/models) و[أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="How do I configure fast mode for GPT 5.5?">
    - **لكل جلسة:** أرسل `/fast on` أثناء استخدام `openai/gpt-5.5`.
    - **كإعداد افتراضي لكل نموذج:** عيّن
      `agents.defaults.models["openai/gpt-5.5"].params.fastMode` إلى `true`.
    - **حد الإيقاف التلقائي:** يشغّل `/fast auto` أو `params.fastMode: "auto"`
      استدعاءات النموذج الجديدة بسرعة حتى بلوغ حد الإيقاف، ثم يشغّل استدعاءات
      إعادة المحاولة أو الرجوع الاحتياطي أو نتائج الأدوات أو المتابعة اللاحقة
      من دون الوضع السريع. القيمة الافتراضية لحد الإيقاف هي
      60 ثانية؛ ويمكن تجاوزها باستخدام `params.fastAutoOnSeconds` في النموذج.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: "auto",
                fastAutoOnSeconds: 30,
              },
            },
          },
        },
      },
    }
    ```

    يتطابق الوضع السريع مع `service_tier = "priority"` في طلبات OpenAI Responses
    الأصلية؛ وتُحفظ قيم `service_tier` الحالية، ولا يعيد الوضع السريع كتابة
    `reasoning` أو `text.verbosity`. تتقدم تجاوزات `/fast` الخاصة بالجلسة على
    إعدادات التهيئة الافتراضية.

    راجع [التفكير والوضع السريع](/ar/tools/thinking) وقسم الوضع السريع
    ضمن الإعدادات المتقدمة في صفحة مزوّد [OpenAI](/ar/providers/openai).

  </Accordion>

  <Accordion title='Why do I see "Model ... is not allowed" and then no reply?'>
    إذا ضُبط `agents.defaults.models`، فإنه يصبح **قائمة السماح** الخاصة
    بـ`/model` وتجاوزات الجلسة. يؤدي اختيار نموذج خارج تلك القائمة إلى إرجاع
    ما يلي بدلًا من رد عادي:

    ```text
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    الإصلاح: أضف النموذج المحدد إلى `agents.defaults.models`، أو أضف حرف بدل
    للمزوّد مثل `"provider/*": {}` للفهارس الديناميكية، أو أزل
    قائمة السماح، أو اختر نموذجًا من `/model list`. إذا تضمن الأمر أيضًا
    `--runtime codex`، فحدّث قائمة السماح أولًا، ثم أعد محاولة
    الأمر نفسه `/model provider/model --runtime codex`.

  </Accordion>

  <Accordion title='Why do I see "Unknown model: minimax/MiniMax-M3"?'>
    إذا كنت تستخدم إصدارًا أقدم من OpenClaw، فقم بالترقية أولًا (أو شغّل من فرع
    المصدر `main`) وأعد تشغيل Gateway؛ فقد لا يكون `MiniMax-M3` موجودًا بعد
    في فهرس الإصدار المثبّت لديك. بخلاف ذلك، يكون مزوّد MiniMax غير
    مُهيأ (لم يُعثر على إدخال للمزوّد أو ملف تعريف مصادقة)، ولذلك يتعذر
    حل النموذج. راجع قسم استكشاف الأخطاء وإصلاحها في صفحة مزوّد
    [MiniMax](/ar/providers/minimax) للاطلاع على قائمة التحقق الكاملة للإصلاح،
    وجدول معرّفات المزوّد/النموذج، ومثال كتلة الإعدادات.

  </Accordion>

  <Accordion title="Can I use MiniMax as my default and OpenAI for complex tasks?">
    نعم. استخدم MiniMax كنموذج افتراضي وبدّل النماذج لكل جلسة؛ فالبدائل
    مخصصة للأخطاء، لا «للمهام الصعبة»، لذلك استخدم `/model` أو وكيلًا منفصلًا.

    **الخيار أ: التبديل لكل جلسة**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M3" },
          models: {
            "minimax/MiniMax-M3": { alias: "minimax" },
            "openai/gpt-5.5": { alias: "gpt" },
          },
        },
      },
    }
    ```

    ثم استخدم `/model gpt`.

    **الخيار ب: وكلاء منفصلون** — يستخدم الوكيل أ MiniMax افتراضيًا، ويستخدم
    الوكيل ب OpenAI افتراضيًا؛ وجّه حسب الوكيل أو استخدم `/agent` للتبديل.

    الوثائق: [النماذج](/ar/concepts/models)، و[توجيه الوكلاء المتعددين](/ar/concepts/multi-agent)،
    و[MiniMax](/ar/providers/minimax)، و[OpenAI](/ar/providers/openai).

  </Accordion>

  <Accordion title="Are opus / sonnet / gpt built-in shortcuts?">
    نعم، هذه اختصارات مضمّنة، ولا تُطبّق إلا عندما يكون النموذج المستهدف موجودًا في
    `agents.defaults.models`:

    | الاسم المستعار | يُحل إلى |
    | --- | --- |
    | `opus` | `anthropic/claude-opus-4-8` |
    | `sonnet` | `anthropic/claude-sonnet-4-6` |
    | `gpt` | `openai/gpt-5.4` |
    | `gpt-mini` | `openai/gpt-5.4-mini` |
    | `gpt-nano` | `openai/gpt-5.4-nano` |
    | `gemini` | `google/gemini-3.1-pro-preview` |
    | `gemini-flash` | `google/gemini-3-flash-preview` |
    | `gemini-flash-lite` | `google/gemini-3.1-flash-lite` |

    يتجاوز اسمك المستعار الذي يحمل الاسم نفسه الاسم المضمّن.

  </Accordion>

  <Accordion title="How do I define/override model shortcuts (aliases)?">
    توجد الأسماء المستعارة في `agents.defaults.models.<modelId>.alias`:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
          },
        },
      },
    }
    ```

    بعد ذلك يُحل `/model sonnet` (أو `/<alias>` عند دعمه) إلى
    معرّف ذلك النموذج.

  </Accordion>

  <Accordion title="How do I add models from other providers like OpenRouter or Z.AI?">
    OpenRouter (الدفع لكل رمز؛ نماذج عديدة):

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
          model: { primary: "zai/glm-5.1" },
          models: { "zai/glm-5.1": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    يؤدي غياب مفتاح المزوّد لمزوّد/نموذج مُشار إليه إلى ظهور خطأ مصادقة
    وقت التشغيل (مثل `No API key found for provider "zai"`).

    **لم يُعثر على مفتاح API للمزوّد بعد إضافة وكيل جديد**

    يكون مخزن المصادقة للوكيل الجديد فارغًا؛ فالمصادقة خاصة بكل وكيل، وتُخزّن في:

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    الإصلاح: شغّل `openclaw agents add <id>` واضبط المصادقة في المعالج، أو
    انسخ فقط ملفات تعريف `api_key`/`token` الثابتة القابلة للنقل من مخزن
    الوكيل الرئيسي. بالنسبة إلى OAuth، سجّل الدخول من الوكيل الجديد عندما يحتاج إلى
    حسابه الخاص. راجع [توجيه الوكلاء المتعددين](/ar/concepts/multi-agent) للاطلاع على
    القواعد الكاملة لإعادة استخدام `agentDir` ومشاركة بيانات الاعتماد — لا تُعِد أبدًا استخدام
    `agentDir` بين الوكلاء.

  </Accordion>
</AccordionGroup>

## تجاوز فشل النموذج و"فشلت جميع النماذج"

<AccordionGroup>
  <Accordion title="كيف يعمل تجاوز الفشل؟">
    مرحلتان:

    1. **تدوير ملفات تعريف المصادقة** ضمن المزوّد نفسه.
    2. **الرجوع إلى نموذج بديل** بالانتقال إلى النموذج التالي في `agents.defaults.model.fallbacks`.

    تُطبَّق فترات تهدئة على ملفات التعريف التي تفشل (تراجع أُسّي)، لذا يواصل OpenClaw
    الاستجابة عندما يفرض المزوّد حدًا على المعدل أو يتعطل مؤقتًا.

    تشمل فئة تحديد المعدل أكثر من مجرد `429`: تُعدّ `Too many concurrent
    requests` و`ThrottlingException` و`concurrency limit reached` و`workers_ai
    ... quota limit exceeded` وقيود نافذة
    الاستخدام الدورية (`weekly/monthly limit reached`) جميعها قيودًا على المعدل
    تستدعي تجاوز الفشل.

    لا تكون استجابات الفوترة دائمًا `402`، كما تبقى بعض استجابات `402` في
    فئة الأخطاء العابرة/تحديد المعدل بدلًا من مسار الفوترة. وقد يظل نص
    الفوترة الصريح في `401`/`403` موجّهًا إلى الفوترة؛ وتظل
    مطابقات النص الخاصة بكل مزوّد (مثل `Key limit exceeded` في OpenRouter) محصورة في
    المزوّد الخاص بها. وتُعامَل استجابة `402` التي تبدو كحد قابل لإعادة المحاولة لنافذة الاستخدام أو
    حد إنفاق للمؤسسة/مساحة العمل (`daily limit reached, resets tomorrow`
    و`organization spending limit exceeded`) على أنها `rate_limit`، لا
    تعطيلًا طويلًا بسبب الفوترة.

    تُستبعد أخطاء تجاوز السياق تمامًا من مسار الرجوع إلى البديل — فالتواقيع
    مثل `request_too_large` و`input exceeds the maximum number of tokens`
    و`input token count exceeds the maximum number of input tokens` و`input is
    too long for the model` و`ollama error: context length exceeded` تنتقل إلى
    Compaction/إعادة المحاولة بدلًا من الانتقال إلى النموذج البديل التالي.

    نطاق نص أخطاء الخادم العام أضيق من «أي شيء يحتوي على unknown/error
    بداخله». ومن أشكال الأخطاء العابرة المقيّدة بالمزوّد التي تُعد إشارات
    لتجاوز الفشل: رسالة Anthropic المجرّدة `An unknown error occurred`، ورسالة OpenRouter المجرّدة
    `Provider returned error`، وأخطاء سبب التوقف مثل `Unhandled stop reason:
    error`، وحمولات JSON من نوع `api_error` التي تحتوي على نص خادم عابر (`internal
    server error` و`unknown error, 520` و`upstream error` و`backend error`)،
    وأخطاء انشغال المزوّد مثل `ModelNotReadyException` عندما يتطابق سياق
    المزوّد. ويظل نص الرجوع الداخلي العام مثل `LLM request failed
    with an unknown error.` محافظًا ولا يؤدي إلى الرجوع إلى بديل
    بمفرده.

  </Accordion>

  <Accordion title='ما معنى "No credentials found for profile anthropic:default"؟'>
    لا يحتوي معرّف ملف تعريف المصادقة `anthropic:default` على بيانات اعتماد في
    مخزن المصادقة المتوقع.

    **قائمة تحقق للإصلاح:**

    - تأكد من مكان ملفات التعريف — الحالي:
      `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`؛ القديم:
      `~/.openclaw/agent/*` (يرحّله `openclaw doctor`).
    - تأكد من أن Gateway يحمّل متغير البيئة لديك. لن يصل `ANTHROPIC_API_KEY` المضبوط فقط في
      صدفتك إلى تشغيل Gateway عبر systemd/launchd — ضعه في
      `~/.openclaw/.env` أو فعّل `env.shellEnv`.
    - تأكد من أنك تعدّل الوكيل الصحيح — تحتوي إعدادات الوكلاء المتعددين على
      عدة ملفات `auth-profiles.json`.
    - شغّل `openclaw models status` لرؤية النماذج المضبوطة وحالة
      مصادقة المزوّد.

    **بالنسبة إلى "No credentials found for profile anthropic" (من دون لاحقة بريد إلكتروني):**

    التشغيل مثبّت على ملف تعريف Anthropic لا يستطيع Gateway العثور عليه.

    - استخدم Claude CLI: شغّل `openclaw models auth login --provider anthropic
      --method cli --set-default` على مضيف Gateway.
    - يُفضّل استخدام مفتاح API بدلًا من ذلك: ضع `ANTHROPIC_API_KEY` في
      `~/.openclaw/.env` على مضيف Gateway، ثم امسح أي ترتيب مثبّت
      يفرض استخدام ملف التعريف المفقود:

      ```bash
      openclaw models auth order clear --provider anthropic
      ```

    - الوضع البعيد: توجد ملفات تعريف المصادقة على جهاز Gateway، لا على
      حاسوبك المحمول — تأكد من أنك تشغّل الأوامر هناك.

  </Accordion>

  <Accordion title="لماذا حاول أيضًا استخدام Google Gemini وفشل؟">
    إذا كان ضبط النموذج لديك يتضمن Google Gemini كخيار بديل (أو إذا
    انتقلت إلى اختصار Gemini)، فسيحاول OpenClaw استخدامه أثناء الرجوع إلى البديل. يؤدي عدم
    ضبط بيانات اعتماد Google إلى `No API key found for provider
    "google"`. الإصلاح: أضف مصادقة Google، أو أزل نماذج Google من
    `agents.defaults.model.fallbacks`/الأسماء المستعارة.

    **رُفض طلب LLM: توقيع التفكير مطلوب (Google Antigravity)**

    السبب: يحتوي سجل الجلسة على كتل تفكير بلا تواقيع (غالبًا
    من دفق أُجهض أو اكتمل جزئيًا)؛ يتطلب Google Antigravity تواقيع
    على كتل التفكير. يزيل OpenClaw كتل التفكير غير الموقعة لـ Google
    Antigravity Claude؛ وإذا استمرت المشكلة، فابدأ جلسة جديدة أو اضبط
    `/thinking off` لذلك الوكيل.

  </Accordion>
</AccordionGroup>

## ملفات تعريف المصادقة: ماهيتها وكيفية إدارتها

ذو صلة: [/concepts/oauth](/ar/concepts/oauth) (تدفقات OAuth، وتخزين الرموز، وأنماط الحسابات المتعددة)

<AccordionGroup>
  <Accordion title="ما ملف تعريف المصادقة؟">
    سجل بيانات اعتماد مُسمّى (OAuth أو مفتاح API) مرتبط بمزوّد، ومخزّن
    في:

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    افحص ملفات التعريف المحفوظة دون كشف الأسرار: `openclaw models auth
    list` (اختياريًا مع `--provider <id>` أو `--json`). راجع
    [CLI للنماذج](/ar/cli/models#auth-profiles).

  </Accordion>

  <Accordion title="ما معرّفات ملفات التعريف الشائعة؟">
    مسبوقة باسم المزوّد: `anthropic:default` (شائع عند عدم وجود هوية
    بريد إلكتروني)، و`anthropic:<email>` لهويات OAuth، أو معرّف مخصص
    تختاره (مثل `anthropic:work`).

  </Accordion>

  <Accordion title="هل يمكنني التحكم في ملف تعريف المصادقة الذي يُجرَّب أولًا؟">
    نعم. يحدد ضبط `auth.order.<provider>` ترتيب التدوير لكل مزوّد
    (بيانات وصفية فقط — لا تُخزّن أسرار).

    قد يتخطى OpenClaw ملف تعريف في **فترة تهدئة** قصيرة (بسبب قيود المعدل،
    أو انتهاء المهلة، أو فشل المصادقة) أو في حالة **تعطيل** أطول
    (بسبب الفوترة/عدم كفاية الرصيد). افحص ذلك باستخدام `openclaw models status
    --json` وتحقق من `auth.unusableProfiles`. اضبطه باستخدام
    `auth.cooldowns.billingBackoffHours*`. يمكن أن تكون فترات تهدئة تحديد المعدل
    مقيّدة بالنموذج — إذ يمكن لملف تعريف في فترة تهدئة لنموذج واحد أن يظل يخدم
    نموذجًا شقيقًا لدى المزوّد نفسه؛ بينما تحظر نوافذ الفوترة/التعطيل
    ملف التعريف بأكمله.

    عيّن تجاوزًا للترتيب لكل وكيل (يُخزّن في `auth-state.json` لذلك الوكيل):

    ```bash
    # Defaults to the configured default agent (omit --agent)
    openclaw models auth order get --provider anthropic

    # Lock rotation to a single profile
    openclaw models auth order set --provider anthropic anthropic:default

    # Or set an explicit order (fallback within provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Clear override (fall back to config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic

    # Target a specific agent
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    تحقق مما سيُجرَّب فعليًا: `openclaw models status --probe`. ويُبلّغ عن
    ملف تعريف مخزّن محذوف من ترتيب صريح بالحالة
    `excluded_by_auth_order` بدلًا من تجربته بصمت.

  </Accordion>

  <Accordion title="ما الفرق بين OAuth ومفتاح API؟">
    - غالبًا ما يستخدم **OAuth / تسجيل الدخول عبر CLI** وصول الاشتراك عندما
      يدعمه المزوّد. بالنسبة إلى Anthropic، تستخدم الواجهة الخلفية لـ Claude CLI في OpenClaw
      الأمر `claude -p` من Claude Code، والذي تتعامل معه Anthropic حاليًا على أنه
      استخدام Agent SDK/برمجي يُحتسب ضمن حدود استخدام الاشتراك —
      راجع [Anthropic](/ar/providers/anthropic) للاطلاع على حالة إيقاف الفوترة مؤقتًا
      الحالية وروابط المصادر.
    - تستخدم **مفاتيح API** فوترة بحسب عدد الرموز.

    يدعم المعالج Anthropic Claude CLI، وOpenAI Codex OAuth، ومفاتيح API.

  </Accordion>
</AccordionGroup>

## ذو صلة

- [الأسئلة الشائعة](/ar/help/faq) — الأسئلة الشائعة الرئيسية
- [الأسئلة الشائعة — البدء السريع وإعداد التشغيل الأول](/ar/help/faq-first-run)
- [اختيار النموذج](/ar/concepts/model-providers)
- [تجاوز فشل النموذج](/ar/concepts/model-failover)
