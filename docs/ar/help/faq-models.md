---
read_when:
    - اختيار النماذج أو التبديل بينها، وتكوين الأسماء المستعارة
    - تصحيح أخطاء التحويل عند فشل النموذج / "فشلت جميع النماذج"
    - فهم ملفات تعريف المصادقة وكيفية إدارتها
sidebarTitle: Models FAQ
summary: 'الأسئلة الشائعة: الإعدادات الافتراضية للنماذج، والاختيار، والأسماء المستعارة، والتبديل، وتجاوز الفشل، وملفات تعريف المصادقة'
title: 'الأسئلة الشائعة: النماذج والمصادقة'
x-i18n:
    generated_at: "2026-05-11T20:34:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a1bd3bcfdca583472d42782448271879a2bcaaa21858ab3304da48556ae922c
    source_path: help/faq-models.md
    workflow: 16
---

  أسئلة وأجوبة حول النماذج وملفات تعريف المصادقة. للإعداد، والجلسات، وGateway، والقنوات، واستكشاف الأخطاء وإصلاحها، راجع [الأسئلة الشائعة](/ar/help/faq) الرئيسية.

  ## النماذج: الافتراضيات، والاختيار، والأسماء المستعارة، والتبديل

  <AccordionGroup>
  <Accordion title='What is the "default model"?'>
    نموذج OpenClaw الافتراضي هو ما تضبطه كالتالي:

    ```
    agents.defaults.model.primary
    ```

    يُشار إلى النماذج بصيغة `provider/model` (مثال: `openai/gpt-5.5` أو `anthropic/claude-sonnet-4-6`). إذا حذفت المزوّد، يحاول OpenClaw أولًا استخدام اسم مستعار، ثم مطابقة مزوّد مكوّن فريد لذلك المعرّف الدقيق للنموذج، وبعدها فقط يعود إلى المزوّد الافتراضي المكوّن كمسار توافق مهمل. إذا لم يعد ذلك المزوّد يوفّر النموذج الافتراضي المكوّن، يعود OpenClaw إلى أول مزوّد/نموذج مكوّن بدلًا من إظهار افتراضي قديم لمزوّد مُزال. مع ذلك، يجب أن تضبط `provider/model` **صراحةً**.

  </Accordion>

  <Accordion title="What model do you recommend?">
    **الافتراضي الموصى به:** استخدم أقوى نموذج من أحدث جيل متاح في مجموعة مزوّديك.
    **للوكلاء الممكّنين بالأدوات أو الذين يتعاملون مع مدخلات غير موثوقة:** أعطِ قوة النموذج أولوية على التكلفة.
    **للدردشة الروتينية/منخفضة المخاطر:** استخدم نماذج احتياطية أرخص ووجّه حسب دور الوكيل.

    لدى MiniMax وثائقه الخاصة: [MiniMax](/ar/providers/minimax) و
    [النماذج المحلية](/ar/gateway/local-models).

    قاعدة عامة: استخدم **أفضل نموذج يمكنك تحمّل تكلفته** للأعمال عالية المخاطر، ونموذجًا أرخص
    للدردشة الروتينية أو الملخصات. يمكنك توجيه النماذج لكل وكيل واستخدام الوكلاء الفرعيين
    لموازاة المهام الطويلة (كل وكيل فرعي يستهلك رموزًا). راجع [النماذج](/ar/concepts/models) و
    [الوكلاء الفرعيون](/ar/tools/subagents).

    تحذير قوي: النماذج الأضعف/المكمّمة بإفراط أكثر عرضة لحقن الموجهات
    والسلوك غير الآمن. راجع [الأمان](/ar/gateway/security).

    مزيد من السياق: [النماذج](/ar/concepts/models).

  </Accordion>

  <Accordion title="How do I switch models without wiping my config?">
    استخدم **أوامر النماذج** أو عدّل حقول **النموذج** فقط. تجنّب استبدال الإعدادات بالكامل.

    خيارات آمنة:

    - `/model` في الدردشة (سريع، لكل جلسة)
    - `openclaw models set ...` (يحدّث إعدادات النموذج فقط)
    - `openclaw configure --section model` (تفاعلي)
    - عدّل `agents.defaults.model` في `~/.openclaw/openclaw.json`

    تجنّب `config.apply` مع كائن جزئي إلا إذا كنت تقصد استبدال الإعداد بالكامل.
    بالنسبة لتعديلات RPC، افحص باستخدام `config.schema.lookup` أولًا وفضّل `config.patch`. تمنحك حمولة lookup المسار المطبّع، ووثائق/قيود المخطط الضحلة، وملخصات الأبناء المباشرين.
    للتحديثات الجزئية.
    إذا كنت قد استبدلت الإعداد، فاستعده من نسخة احتياطية أو أعد تشغيل `openclaw doctor` للإصلاح.

    الوثائق: [النماذج](/ar/concepts/models)، [التكوين](/ar/cli/configure)، [الإعدادات](/ar/cli/config)، [Doctor](/ar/gateway/doctor).

  </Accordion>

  <Accordion title="Can I use self-hosted models (llama.cpp, vLLM, Ollama)?">
    نعم. Ollama هو أسهل مسار للنماذج المحلية.

    أسرع إعداد:

    1. ثبّت Ollama من `https://ollama.com/download`
    2. اسحب نموذجًا محليًا مثل `ollama pull gemma4`
    3. إذا كنت تريد نماذج سحابية أيضًا، شغّل `ollama signin`
    4. شغّل `openclaw onboard` واختر `Ollama`
    5. اختر `Local` أو `Cloud + Local`

    ملاحظات:

    - يمنحك `Cloud + Local` نماذج سحابية بالإضافة إلى نماذج Ollama المحلية لديك
    - النماذج السحابية مثل `kimi-k2.5:cloud` لا تحتاج إلى سحب محلي
    - للتبديل اليدوي، استخدم `openclaw models list` و`openclaw models set ollama/<model>`

    ملاحظة أمان: النماذج الأصغر أو المكمّمة بشدة أكثر عرضة لحقن الموجهات.
    نوصي بشدة باستخدام **نماذج كبيرة** لأي بوت يمكنه استخدام الأدوات.
    إذا كنت لا تزال تريد نماذج صغيرة، فمكّن العزل وقوائم سماح صارمة للأدوات.

    الوثائق: [Ollama](/ar/providers/ollama)، [النماذج المحلية](/ar/gateway/local-models)،
    [مزوّدو النماذج](/ar/concepts/model-providers)، [الأمان](/ar/gateway/security)،
    [العزل](/ar/gateway/sandboxing).

  </Accordion>

  <Accordion title="What do OpenClaw, Flawd, and Krill use for models?">
    - يمكن أن تختلف هذه النشرات وقد تتغير بمرور الوقت؛ لا توجد توصية ثابتة لمزوّد.
    - تحقّق من إعداد التشغيل الحالي على كل gateway باستخدام `openclaw models status`.
    - للوكلاء الحساسين أمنيًا/الممكّنين بالأدوات، استخدم أقوى نموذج من أحدث جيل متاح.

  </Accordion>

  <Accordion title="How do I switch models on the fly (without restarting)?">
    استخدم أمر `/model` كرسالة مستقلة:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    هذه هي الأسماء المستعارة المضمّنة. يمكن إضافة أسماء مستعارة مخصصة عبر `agents.defaults.models`.

    يمكنك عرض النماذج المتاحة باستخدام `/model` أو `/model list` أو `/model status`.

    يعرض `/model` (و`/model list`) منتقيًا مضغوطًا مرقّمًا. اختر بالرقم:

    ```
    /model 3
    ```

    يمكنك أيضًا فرض ملف تعريف مصادقة محدد للمزوّد (لكل جلسة):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    نصيحة: يعرض `/model status` الوكيل النشط، وملف `auth-profiles.json` المستخدم، وملف تعريف المصادقة الذي ستتم تجربته بعد ذلك.
    كما يعرض نقطة نهاية المزوّد المكوّنة (`baseUrl`) ووضع API (`api`) عند توفرهما.

    **كيف ألغي تثبيت ملف تعريف ضبطته باستخدام @profile؟**

    أعد تشغيل `/model` **بدون** اللاحقة `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    إذا كنت تريد الرجوع إلى الافتراضي، فاختره من `/model` (أو أرسل `/model <default provider/model>`).
    استخدم `/model status` لتأكيد ملف تعريف المصادقة النشط.

  </Accordion>

  <Accordion title="If two providers expose the same model id, which one does /model use?">
    يختار `/model provider/model` مسار ذلك المزوّد الدقيق للجلسة.

    على سبيل المثال، `qianfan/deepseek-v4-flash` و`deepseek/deepseek-v4-flash` هما مرجعان مختلفان للنموذج رغم أن كليهما يحتوي على `deepseek-v4-flash`. يجب ألا يبدّل OpenClaw بصمت من مزوّد إلى آخر لمجرد أن معرّف النموذج المجرّد يطابق.

    يكون مرجع `/model` الذي اختاره المستخدم صارمًا أيضًا لسياسة الرجوع الاحتياطي. إذا كان ذلك المزوّد/النموذج المحدد غير متاح، يفشل الرد بوضوح بدلًا من الإجابة من `agents.defaults.model.fallbacks`. لا تزال سلاسل الرجوع الاحتياطي المكوّنة تنطبق على الافتراضيات المكوّنة، وأساسيات مهام Cron، وحالة الرجوع الاحتياطي المختارة تلقائيًا.

    إذا سُمح لتشغيل بدأ من تجاوز غير جلسي باستخدام الرجوع الاحتياطي، يحاول OpenClaw المزوّد/النموذج المطلوب أولًا، ثم البدائل الاحتياطية المكوّنة، وبعد ذلك فقط الأساسي المكوّن. يمنع ذلك معرّفات النماذج المجرّدة المكررة من القفز مباشرةً إلى المزوّد الافتراضي.

    راجع [النماذج](/ar/concepts/models) و[تجاوز فشل النماذج](/ar/concepts/model-failover).

  </Accordion>

  <Accordion title="Can I use GPT 5.5 for daily tasks and Codex 5.5 for coding?">
    نعم. تعامل مع اختيار النموذج واختيار وقت التشغيل بشكل منفصل:

    - **وكيل البرمجة الأصلي Codex:** اضبط `agents.defaults.model.primary` على `openai/gpt-5.5`. سجّل الدخول باستخدام `openclaw models auth login --provider openai-codex` عندما تريد مصادقة اشتراك ChatGPT/Codex.
    - **مهام OpenAI API المباشرة خارج حلقة الوكيل:** اضبط `OPENAI_API_KEY` للصور، والتضمينات، والكلام، والوقت الحقيقي، وسائر أسطح OpenAI API غير الخاصة بالوكيل.
    - **مصادقة مفتاح API لوكيل OpenAI:** استخدم `/model openai/gpt-5.5` مع ملف تعريف مفتاح API مرتّب لـ `openai-codex`.
    - **الوكلاء الفرعيون:** وجّه مهام البرمجة إلى وكيل يركز على Codex بنموذجه الخاص `openai/gpt-5.5`.

    راجع [النماذج](/ar/concepts/models) و[أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="How do I configure fast mode for GPT 5.5?">
    استخدم إما تبديلًا للجلسة أو افتراضي إعداد:

    - **لكل جلسة:** أرسل `/fast on` أثناء استخدام الجلسة لـ `openai/gpt-5.5`.
    - **افتراضي لكل نموذج:** اضبط `agents.defaults.models["openai/gpt-5.5"].params.fastMode` على `true`.

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

    بالنسبة إلى OpenAI، يطابق الوضع السريع `service_tier = "priority"` في طلبات Responses الأصلية المدعومة. تتفوّق تجاوزات `/fast` للجلسة على افتراضيات الإعداد.

    راجع [التفكير والوضع السريع](/ar/tools/thinking) و[الوضع السريع في OpenAI](/ar/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='Why do I see "Model ... is not allowed" and then no reply?'>
    إذا تم ضبط `agents.defaults.models`، تصبح **قائمة السماح** لـ `/model` وأي
    تجاوزات للجلسة. اختيار نموذج غير موجود في تلك القائمة يعيد:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    يُعاد ذلك الخطأ **بدلًا من** رد عادي. الإصلاح: أضف النموذج الدقيق إلى
    `agents.defaults.models`، أو أضف حرف بدل للمزوّد مثل `"provider/*": {}` لفهارس المزوّدين الديناميكية، أو أزل قائمة السماح، أو اختر نموذجًا من `/model list`.
    إذا كان الأمر يتضمن أيضًا `--runtime codex`، فحدّث قائمة السماح أولًا ثم أعد محاولة
    أمر `/model provider/model --runtime codex` نفسه.

  </Accordion>

  <Accordion title='Why do I see "Unknown model: minimax/MiniMax-M2.7"?'>
    يعني هذا أن **المزوّد غير مكوّن** (لم يتم العثور على إعداد مزوّد MiniMax أو ملف تعريف
    مصادقة)، لذلك لا يمكن حل النموذج.

    قائمة تحقق للإصلاح:

    1. حدّث إلى إصدار OpenClaw حالي (أو شغّل من المصدر `main`)، ثم أعد تشغيل gateway.
    2. تأكد من تكوين MiniMax (المعالج أو JSON)، أو من وجود مصادقة MiniMax
       في البيئة/ملفات تعريف المصادقة بحيث يمكن حقن المزوّد المطابق
       (`MINIMAX_API_KEY` لـ `minimax`، أو `MINIMAX_OAUTH_TOKEN` أو OAuth مخزّن من MiniMax
       لـ `minimax-portal`).
    3. استخدم معرّف النموذج الدقيق (حساس لحالة الأحرف) لمسار المصادقة لديك:
       `minimax/MiniMax-M2.7` أو `minimax/MiniMax-M2.7-highspeed` لإعداد مفتاح API،
       أو `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` لإعداد OAuth.
    4. شغّل:

       ```bash
       openclaw models list
       ```

       واختر من القائمة (أو `/model list` في الدردشة).

    راجع [MiniMax](/ar/providers/minimax) و[النماذج](/ar/concepts/models).

  </Accordion>

  <Accordion title="Can I use MiniMax as my default and OpenAI for complex tasks?">
    نعم. استخدم **MiniMax كافتراضي** وبدّل النماذج **لكل جلسة** عند الحاجة.
    البدائل الاحتياطية مخصصة **للأخطاء**، وليس "للمهام الصعبة"، لذلك استخدم `/model` أو وكيلًا منفصلًا.

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

    - افتراضي الوكيل A: MiniMax
    - افتراضي الوكيل B: OpenAI
    - وجّه حسب الوكيل أو استخدم `/agent` للتبديل

    الوثائق: [النماذج](/ar/concepts/models)، [توجيه الوكلاء المتعددين](/ar/concepts/multi-agent)، [MiniMax](/ar/providers/minimax)، [OpenAI](/ar/providers/openai).

  </Accordion>

  <Accordion title="Are opus / sonnet / gpt built-in shortcuts?">
    نعم. يأتي OpenClaw مع بعض الاختصارات الافتراضية (تُطبّق فقط عندما يكون النموذج موجودًا في `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    إذا عيّنت اسمًا مستعارًا خاصًا بك بالاسم نفسه، فستكون قيمتك هي المعتمدة.

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

    بعد ذلك، يتحول `/model sonnet` (أو `/<alias>` عند دعمه) إلى معرّف النموذج ذاك.

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

    إذا أشرت إلى مزوّد/نموذج لكن مفتاح المزوّد المطلوب غير موجود، فستحصل على خطأ مصادقة وقت التشغيل (مثل `No API key found for provider "zai"`).

    **لم يتم العثور على مفتاح API للمزوّد بعد إضافة وكيل جديد**

    يعني هذا عادةً أن **الوكيل الجديد** لديه مخزن مصادقة فارغ. تكون المصادقة لكل وكيل على حدة
    وتُخزَّن في:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    خيارات الإصلاح:

    - شغّل `openclaw agents add <id>` وهيّئ المصادقة أثناء المعالج.
    - أو انسخ فقط ملفات تعريف `api_key` / `token` الثابتة القابلة للنقل من مخزن مصادقة الوكيل الرئيسي إلى مخزن مصادقة الوكيل الجديد.
    - بالنسبة إلى ملفات تعريف OAuth، سجّل الدخول من الوكيل الجديد عندما يحتاج إلى حسابه الخاص؛ وإلا يستطيع OpenClaw القراءة عبر الوكيل الافتراضي/الرئيسي دون استنساخ رموز التحديث.

    لا **تعد** استخدام `agentDir` بين الوكلاء؛ فهذا يسبب تصادمات في المصادقة/الجلسات.

  </Accordion>
</AccordionGroup>

## تجاوز فشل النموذج و"فشلت كل النماذج"

<AccordionGroup>
  <Accordion title="كيف يعمل تجاوز الفشل؟">
    يحدث تجاوز الفشل على مرحلتين:

    1. **تدوير ملفات تعريف المصادقة** ضمن المزوّد نفسه.
    2. **الرجوع إلى نموذج احتياطي** وهو النموذج التالي في `agents.defaults.model.fallbacks`.

    تنطبق فترات التهدئة على ملفات التعريف الفاشلة (تراجع أُسّي)، بحيث يستطيع OpenClaw مواصلة الاستجابة حتى عندما يكون المزوّد محدود المعدل أو يفشل مؤقتًا.

    تشمل حاوية حدود المعدل أكثر من استجابات `429` العادية. يتعامل OpenClaw
    أيضًا مع رسائل مثل `Too many concurrent requests`،
    و`ThrottlingException`، و`concurrency limit reached`،
    و`workers_ai ... quota limit exceeded`، و`resource exhausted`، وحدود
    نوافذ الاستخدام الدورية (`weekly/monthly limit reached`) على أنها حدود معدل
    تستحق تجاوز الفشل.

    بعض الاستجابات التي تبدو متعلقة بالفوترة ليست `402`، وبعض استجابات HTTP `402`
    تبقى أيضًا في تلك الحاوية المؤقتة. إذا أعاد مزوّد نص فوترة صريحًا مع `401` أو `403`،
    يستطيع OpenClaw إبقاء ذلك في مسار الفوترة، لكن مطابِقات النص الخاصة بالمزوّد تبقى
    محصورة في المزوّد الذي يملكها (مثل OpenRouter `Key limit exceeded`). أما إذا بدت رسالة `402`
    بدلًا من ذلك كنافذة استخدام قابلة لإعادة المحاولة أو حد إنفاق لمؤسسة/مساحة عمل
    (`daily limit reached, resets tomorrow`،
    `organization spending limit exceeded`)، فيتعامل معها OpenClaw على أنها
    `rate_limit`، وليس تعطيل فوترة طويل الأمد.

    تختلف أخطاء تجاوز السياق: تواقيع مثل
    `request_too_large`، و`input exceeds the maximum number of tokens`،
    و`input token count exceeds the maximum number of input tokens`،
    و`input is too long for the model`، أو `ollama error: context length
    exceeded` تبقى على مسار Compaction/إعادة المحاولة بدلًا من التقدم إلى
    الرجوع إلى نموذج احتياطي.

    نص خطأ الخادم العام أضيق عمدًا من "أي شيء يحتوي على
    unknown/error". يتعامل OpenClaw فعلًا مع الأشكال المؤقتة المحصورة بالمزوّد
    مثل `An unknown error occurred` المجردة من Anthropic، و`Provider returned error`
    المجردة من OpenRouter، وأخطاء سبب الإيقاف مثل `Unhandled stop reason:
    error`، وحمولات JSON ذات `api_error` مع نص خادم مؤقت
    (`internal server error`، و`unknown error, 520`، و`upstream error`، و`backend
    error`)، وأخطاء انشغال المزوّد مثل `ModelNotReadyException` على أنها
    إشارات مهلة/حمل زائد تستحق تجاوز الفشل عندما يتطابق سياق المزوّد.
    يبقى نص الرجوع الداخلي العام مثل `LLM request failed with an unknown
    error.` محافظًا ولا يفعّل الرجوع إلى نموذج احتياطي بمفرده.

  </Accordion>

  <Accordion title='ماذا يعني "No credentials found for profile anthropic:default"؟'>
    يعني أن النظام حاول استخدام معرّف ملف تعريف المصادقة `anthropic:default`، لكنه لم يعثر على بيانات الاعتماد له في مخزن المصادقة المتوقع.

    **قائمة تحقق للإصلاح:**

    - **تأكد من مكان وجود ملفات تعريف المصادقة** (المسارات الجديدة مقابل القديمة)
      - الحالي: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - القديم: `~/.openclaw/agent/*` (يهاجره `openclaw doctor`)
    - **تأكد من أن متغير البيئة لديك محمّل بواسطة Gateway**
      - إذا عيّنت `ANTHROPIC_API_KEY` في الصدفة لديك لكنك تشغّل Gateway عبر systemd/launchd، فقد لا يرثه. ضعه في `~/.openclaw/.env` أو فعّل `env.shellEnv`.
    - **تأكد من أنك تعدّل الوكيل الصحيح**
      - تعني إعدادات الوكلاء المتعددة أنه يمكن أن توجد عدة ملفات `auth-profiles.json`.
    - **تحقق بسرعة من حالة النموذج/المصادقة**
      - استخدم `openclaw models status` للاطلاع على النماذج المهيأة وما إذا كان المزوّدون موثّقين.

    **قائمة تحقق للإصلاح لـ "No credentials found for profile anthropic"**

    يعني هذا أن التشغيل مثبت على ملف تعريف مصادقة Anthropic، لكن Gateway
    لا يستطيع العثور عليه في مخزن المصادقة الخاص به.

    - **استخدم Claude CLI**
      - شغّل `openclaw models auth login --provider anthropic --method cli --set-default` على مضيف Gateway.
    - **إذا أردت استخدام مفتاح API بدلًا من ذلك**
      - ضع `ANTHROPIC_API_KEY` في `~/.openclaw/.env` على **مضيف Gateway**.
      - امسح أي ترتيب مثبت يفرض ملف تعريف مفقودًا:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **تأكد من أنك تشغّل الأوامر على مضيف Gateway**
      - في الوضع البعيد، توجد ملفات تعريف المصادقة على جهاز Gateway، وليس على حاسوبك المحمول.

  </Accordion>

  <Accordion title="لماذا جرّب أيضًا Google Gemini وفشل؟">
    إذا كان تكوين النموذج لديك يتضمن Google Gemini كنموذج احتياطي (أو تحولت إلى اختصار Gemini)، فسيجرّبه OpenClaw أثناء الرجوع إلى نموذج احتياطي. إذا لم تكن قد هيّأت بيانات اعتماد Google، فسترى `No API key found for provider "google"`.

    الإصلاح: إما توفير مصادقة Google، أو إزالة/تجنب نماذج Google في `agents.defaults.model.fallbacks` / الأسماء المستعارة بحيث لا يوجّه الرجوع إليها.

    **رُفض طلب LLM: توقيع التفكير مطلوب (Google Antigravity)**

    السبب: يحتوي سجل الجلسة على **كتل تفكير بلا تواقيع** (غالبًا من
    بث مُجهض/جزئي). يتطلب Google Antigravity تواقيع لكتل التفكير.

    الإصلاح: يزيل OpenClaw الآن كتل التفكير غير الموقعة لـ Google Antigravity Claude. إذا ظل يظهر، فابدأ **جلسة جديدة** أو اضبط `/thinking off` لذلك الوكيل.

  </Accordion>
</AccordionGroup>

## ملفات تعريف المصادقة: ما هي وكيف تديرها

ذو صلة: [/concepts/oauth](/ar/concepts/oauth) (تدفقات OAuth، تخزين الرموز، أنماط الحسابات المتعددة)

<AccordionGroup>
  <Accordion title="ما ملف تعريف المصادقة؟">
    ملف تعريف المصادقة هو سجل بيانات اعتماد مسمى (OAuth أو مفتاح API) مرتبط بمزوّد. توجد ملفات التعريف في:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    لفحص ملفات التعريف المحفوظة دون عرض الأسرار، شغّل `openclaw models auth list` (اختياريًا `--provider <id>` أو `--json`). راجع [Models CLI](/ar/cli/models#auth-profiles) للتفاصيل.

  </Accordion>

  <Accordion title="ما معرّفات ملفات التعريف المعتادة؟">
    يستخدم OpenClaw معرّفات مسبوقة بالمزوّد مثل:

    - `anthropic:default` (شائع عندما لا توجد هوية بريد إلكتروني)
    - `anthropic:<email>` لهويات OAuth
    - معرّفات مخصصة تختارها (مثل `anthropic:work`)

  </Accordion>

  <Accordion title="هل يمكنني التحكم في ملف تعريف المصادقة الذي يُجرَّب أولًا؟">
    نعم. يدعم التكوين بيانات وصفية اختيارية لملفات التعريف وترتيبًا لكل مزوّد (`auth.order.<provider>`). هذا لا **يخزن** أسرارًا؛ بل يربط المعرّفات بالمزوّد/الوضع ويعيّن ترتيب التدوير.

    قد يتخطى OpenClaw ملف تعريف مؤقتًا إذا كان في **فترة تهدئة** قصيرة (حدود معدل/مهلات/إخفاقات مصادقة) أو في حالة **تعطيل** أطول (فوترة/أرصدة غير كافية). لفحص ذلك، شغّل `openclaw models status --json` وتحقق من `auth.unusableProfiles`. الضبط: `auth.cooldowns.billingBackoffHours*`.

    يمكن أن تكون فترات تهدئة حدود المعدل محصورة بالنموذج. ملف التعريف الذي يكون في فترة تهدئة
    لنموذج واحد يمكن أن يظل قابلًا للاستخدام لنموذج شقيق لدى المزوّد نفسه،
    بينما تظل نوافذ الفوترة/التعطيل تحظر ملف التعريف بأكمله.

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

    للتحقق مما سيُجرَّب فعليًا، استخدم:

    ```bash
    openclaw models status --probe
    ```

    إذا حُذف ملف تعريف مخزّن من الترتيب الصريح، يبلّغ الفحص
    بـ `excluded_by_auth_order` لذلك الملف بدلًا من تجربته بصمت.

  </Accordion>

  <Accordion title="OAuth مقابل مفتاح API - ما الفرق؟">
    يدعم OpenClaw كليهما:

    - **OAuth** غالبًا يستفيد من وصول الاشتراك (حيثما ينطبق).
    - **مفاتيح API** تستخدم فوترة الدفع لكل رمز.

    يدعم المعالج صراحةً Anthropic Claude CLI، وOpenAI Codex OAuth، ومفاتيح API.

  </Accordion>
</AccordionGroup>

## ذو صلة

- [الأسئلة الشائعة](/ar/help/faq) — الأسئلة الشائعة الرئيسية
- [الأسئلة الشائعة — البدء السريع وإعداد التشغيل الأول](/ar/help/faq-first-run)
- [اختيار النموذج](/ar/concepts/model-providers)
- [تجاوز فشل النموذج](/ar/concepts/model-failover)
