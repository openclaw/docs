---
read_when:
    - اختيار النماذج أو التبديل بينها، وتكوين الأسماء المستعارة
    - تصحيح أخطاء تجاوز فشل النماذج / "فشلت كل النماذج"
    - فهم ملفات تعريف المصادقة وكيفية إدارتها
sidebarTitle: Models FAQ
summary: 'الأسئلة الشائعة: الإعدادات الافتراضية للنماذج، واختيارها، والأسماء المستعارة، والتبديل بينها، وتجاوز الفشل، وملفات تعريف المصادقة'
title: 'الأسئلة الشائعة: النماذج والمصادقة'
x-i18n:
    generated_at: "2026-05-12T04:10:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: a42a8c24798908c7782a9f0c6f0af3fac0c1ad4e5f80d64778f6fd7e1e174f3b
    source_path: help/faq-models.md
    workflow: 16
---

  أسئلة وأجوبة حول النماذج وملفات تعريف المصادقة. للإعداد والجلسات وGateway والقنوات
  واستكشاف الأخطاء وإصلاحها، راجع [الأسئلة الشائعة](/ar/help/faq) الرئيسية.

  ## النماذج: الإعدادات الافتراضية، والاختيار، والأسماء المستعارة، والتبديل

  <AccordionGroup>
  <Accordion title='ما هو "النموذج الافتراضي"؟'>
    النموذج الافتراضي في OpenClaw هو ما تضبطه على أنه:

    ```
    agents.defaults.model.primary
    ```

    تتم الإشارة إلى النماذج بصيغة `provider/model` (مثال: `openai/gpt-5.5` أو `anthropic/claude-sonnet-4-6`). إذا حذفت المزوّد، فسيحاول OpenClaw أولًا استخدام اسم مستعار، ثم مطابقة فريدة لمزوّد مُعدّ لذلك المعرّف الدقيق للنموذج، وبعدها فقط يعود إلى المزوّد الافتراضي المُعدّ كمسار توافق مهمل. إذا لم يعد ذلك المزوّد يعرض النموذج الافتراضي المُعدّ، فسيرجع OpenClaw إلى أول مزوّد/نموذج مُعدّ بدلًا من إظهار قيمة افتراضية قديمة لمزوّد أُزيل. مع ذلك، ينبغي لك **صراحةً** ضبط `provider/model`.

  </Accordion>

  <Accordion title="ما النموذج الذي توصون به؟">
    **الإعداد الافتراضي الموصى به:** استخدم أقوى نموذج من أحدث جيل متاح في مجموعة المزوّدين لديك.
    **للوكلاء المفعّلين بالأدوات أو مدخلات غير موثوقة:** أعطِ الأولوية لقوة النموذج على التكلفة.
    **للدردشة الروتينية/منخفضة المخاطر:** استخدم نماذج احتياطية أرخص ووجّه حسب دور الوكيل.

    لدى MiniMax وثائقها الخاصة: [MiniMax](/ar/providers/minimax) و
    [النماذج المحلية](/ar/gateway/local-models).

    القاعدة العامة: استخدم **أفضل نموذج يمكنك تحمل تكلفته** للأعمال عالية المخاطر، ونموذجًا أرخص
    للدردشة الروتينية أو الملخصات. يمكنك توجيه النماذج لكل وكيل واستخدام الوكلاء الفرعيين
    لموازاة المهام الطويلة (يستهلك كل وكيل فرعي رموزًا). راجع [النماذج](/ar/concepts/models) و
    [الوكلاء الفرعيون](/ar/tools/subagents).

    تحذير قوي: النماذج الأضعف/المُكمّمة بإفراط تكون أكثر عرضة لحقن التعليمات
    والسلوك غير الآمن. راجع [الأمان](/ar/gateway/security).

    لمزيد من السياق: [النماذج](/ar/concepts/models).

  </Accordion>

  <Accordion title="كيف أبدّل النماذج دون مسح إعدادي؟">
    استخدم **أوامر النماذج** أو عدّل حقول **النموذج** فقط. تجنّب استبدال الإعداد بالكامل.

    خيارات آمنة:

    - `/model` في الدردشة (سريع، لكل جلسة)
    - `openclaw models set ...` (يحدّث إعداد النموذج فقط)
    - `openclaw configure --section model` (تفاعلي)
    - عدّل `agents.defaults.model` في `~/.openclaw/openclaw.json`

    تجنّب `config.apply` مع كائن جزئي إلا إذا كنت تقصد استبدال الإعداد بالكامل.
    لتعديلات RPC، افحص أولًا باستخدام `config.schema.lookup` وفضّل `config.patch`. تمنحك حمولة lookup المسار المطبع، ووثائق/قيود المخطط السطحية، وملخصات الأبناء المباشرين.
    للتحديثات الجزئية.
    إذا استبدلت الإعداد بالفعل، فاستعد من نسخة احتياطية أو أعد تشغيل `openclaw doctor` للإصلاح.

    الوثائق: [النماذج](/ar/concepts/models)، [الإعداد](/ar/cli/configure)، [الإعدادات](/ar/cli/config)، [Doctor](/ar/gateway/doctor).

  </Accordion>

  <Accordion title="هل يمكنني استخدام نماذج مستضافة ذاتيًا (llama.cpp، vLLM، Ollama)؟">
    نعم. Ollama هو أسهل مسار للنماذج المحلية.

    أسرع إعداد:

    1. ثبّت Ollama من `https://ollama.com/download`
    2. اسحب نموذجًا محليًا مثل `ollama pull gemma4`
    3. إذا كنت تريد نماذج سحابية أيضًا، شغّل `ollama signin`
    4. شغّل `openclaw onboard` واختر `Ollama`
    5. اختر `Local` أو `Cloud + Local`

    ملاحظات:

    - يمنحك `Cloud + Local` نماذج سحابية إضافة إلى نماذج Ollama المحلية لديك
    - النماذج السحابية مثل `kimi-k2.5:cloud` لا تحتاج إلى سحب محلي
    - للتبديل اليدوي، استخدم `openclaw models list` و`openclaw models set ollama/<model>`

    ملاحظة أمنية: النماذج الأصغر أو المُكمّمة بشدة تكون أكثر عرضة لحقن التعليمات.
    نوصي بشدة باستخدام **نماذج كبيرة** لأي بوت يمكنه استخدام الأدوات.
    إذا كنت لا تزال تريد نماذج صغيرة، ففعّل العزل وقوائم السماح الصارمة للأدوات.

    الوثائق: [Ollama](/ar/providers/ollama)، [النماذج المحلية](/ar/gateway/local-models)،
    [مزوّدو النماذج](/ar/concepts/model-providers)، [الأمان](/ar/gateway/security)،
    [العزل](/ar/gateway/sandboxing).

  </Accordion>

  <Accordion title="ما النماذج التي يستخدمها OpenClaw وFlawd وKrill؟">
    - قد تختلف هذه عمليات النشر وقد تتغير مع الوقت؛ لا توجد توصية ثابتة لمزوّد.
    - تحقّق من إعداد وقت التشغيل الحالي على كل Gateway باستخدام `openclaw models status`.
    - للوكلاء الحساسين أمنيًا/المفعّلين بالأدوات، استخدم أقوى نموذج من أحدث جيل متاح.

  </Accordion>

  <Accordion title="كيف أبدّل النماذج أثناء التشغيل (دون إعادة التشغيل)؟">
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

    يمكنك سرد النماذج المتاحة باستخدام `/model` أو `/model list` أو `/model status`.

    يعرض `/model` (و`/model list`) منتقيًا مرقمًا وموجزًا. اختر بالرقم:

    ```
    /model 3
    ```

    يمكنك أيضًا فرض ملف تعريف مصادقة محدد للمزوّد (لكل جلسة):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    تلميح: يعرض `/model status` الوكيل النشط، وملف `auth-profiles.json` المستخدم، وملف تعريف المصادقة الذي ستتم تجربته بعد ذلك.
    كما يعرض نقطة نهاية المزوّد المُعدّة (`baseUrl`) ووضع API (`api`) عند توفرهما.

    **كيف ألغي تثبيت ملف تعريف ضبطته باستخدام @profile؟**

    أعد تشغيل `/model` **من دون** اللاحقة `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    إذا أردت العودة إلى الإعداد الافتراضي، فاختره من `/model` (أو أرسل `/model <default provider/model>`).
    استخدم `/model status` للتأكد من ملف تعريف المصادقة النشط.

  </Accordion>

  <Accordion title="إذا كان مزوّدان يعرضان معرّف النموذج نفسه، فأيهما يستخدم /model؟">
    يحدد `/model provider/model` مسار ذلك المزوّد الدقيق للجلسة.

    على سبيل المثال، `qianfan/deepseek-v4-flash` و`deepseek/deepseek-v4-flash` هما مرجعان مختلفان للنموذج رغم أن كليهما يحتوي على `deepseek-v4-flash`. ينبغي ألا يبدّل OpenClaw بصمت من مزوّد إلى آخر لمجرد أن معرّف النموذج المجرّد يطابق.

    مرجع `/model` الذي يختاره المستخدم صارم أيضًا لسياسة الرجوع الاحتياطي. إذا كان المزوّد/النموذج المحدد غير متاح، يفشل الرد بشكل مرئي بدلًا من الإجابة من `agents.defaults.model.fallbacks`. لا تزال سلاسل الرجوع الاحتياطي المُعدّة تنطبق على الإعدادات الافتراضية المُعدّة، وأساسيات مهام cron، وحالة الرجوع الاحتياطي المحددة تلقائيًا.

    إذا كان يُسمح لتشغيل بدأ من تجاوز غير خاص بالجلسة باستخدام الرجوع الاحتياطي، فسيحاول OpenClaw المزوّد/النموذج المطلوب أولًا، ثم خيارات الرجوع الاحتياطي المُعدّة، وبعدها فقط الأساسي المُعدّ. يمنع ذلك معرّفات النماذج المجرّدة المكررة من القفز مباشرة إلى المزوّد الافتراضي.

    راجع [النماذج](/ar/concepts/models) و[تجاوز فشل النموذج](/ar/concepts/model-failover).

  </Accordion>

  <Accordion title="هل يمكنني استخدام GPT 5.5 للمهام اليومية وCodex 5.5 للبرمجة؟">
    نعم. تعامل مع اختيار النموذج واختيار وقت التشغيل بشكل منفصل:

    - **وكيل البرمجة Codex الأصلي:** اضبط `agents.defaults.model.primary` على `openai/gpt-5.5`. سجّل الدخول باستخدام `openclaw models auth login --provider openai-codex` عندما تريد مصادقة اشتراك ChatGPT/Codex.
    - **مهام OpenAI API المباشرة خارج حلقة الوكيل:** اضبط `OPENAI_API_KEY` للصور والتضمينات والكلام والوقت الفعلي وسائر أسطح OpenAI API غير الخاصة بالوكلاء.
    - **مصادقة مفتاح API لوكيل OpenAI:** استخدم `/model openai/gpt-5.5` مع ملف تعريف مفتاح API مرتب لـ `openai-codex`.
    - **الوكلاء الفرعيون:** وجّه مهام البرمجة إلى وكيل يركز على Codex مع نموذج `openai/gpt-5.5` الخاص به.

    راجع [النماذج](/ar/concepts/models) و[أوامر Slash](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="كيف أعدّ الوضع السريع لـ GPT 5.5؟">
    استخدم إما تبديلًا للجلسة أو إعدادًا افتراضيًا في الإعدادات:

    - **لكل جلسة:** أرسل `/fast on` أثناء استخدام الجلسة لـ `openai/gpt-5.5`.
    - **كإعداد افتراضي لكل نموذج:** اضبط `agents.defaults.models["openai/gpt-5.5"].params.fastMode` على `true`.

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

    بالنسبة إلى OpenAI، يرتبط الوضع السريع بـ `service_tier = "priority"` في طلبات Responses الأصلية المدعومة. تتغلب تجاوزات `/fast` للجلسة على الإعدادات الافتراضية.

    راجع [التفكير والوضع السريع](/ar/tools/thinking) و[الوضع السريع في OpenAI](/ar/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='لماذا أرى "Model ... is not allowed" ثم لا يصل أي رد؟'>
    إذا تم ضبط `agents.defaults.models`، فإنه يصبح **قائمة السماح** لـ `/model` وأي
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

  <Accordion title='لماذا أرى "Unknown model: minimax/MiniMax-M2.7"؟'>
    يعني هذا أن **المزوّد غير مُعدّ** (لم يُعثر على إعداد مزوّد MiniMax أو ملف تعريف
    مصادقة)، لذلك لا يمكن حل النموذج.

    قائمة فحص الإصلاح:

    1. رقِّ إلى إصدار OpenClaw حالي (أو شغّل من المصدر `main`)، ثم أعد تشغيل Gateway.
    2. تأكد من إعداد MiniMax (المعالج أو JSON)، أو من وجود مصادقة MiniMax
       في البيئة/ملفات تعريف المصادقة حتى يمكن حقن المزوّد المطابق
       (`MINIMAX_API_KEY` لـ `minimax`، أو `MINIMAX_OAUTH_TOKEN` أو OAuth مخزّن لـ MiniMax
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

  <Accordion title="هل يمكنني استخدام MiniMax كافتراضي وOpenAI للمهام المعقدة؟">
    نعم. استخدم **MiniMax كإعداد افتراضي** وبدّل النماذج **لكل جلسة** عند الحاجة.
    خيارات الرجوع الاحتياطي مخصصة **للأخطاء**، لا "للمهام الصعبة"، لذا استخدم `/model` أو وكيلًا منفصلًا.

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

  <Accordion title="هل opus / sonnet / gpt اختصارات مضمّنة؟">
    نعم. يوفّر OpenClaw بعض الاختصارات الافتراضية (تُطبّق فقط عندما يكون النموذج موجودًا في `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-7`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    إذا عرّفت اسمًا مستعارًا خاصًا بك بالاسم نفسه، فستكون قيمتك هي المعتمدة.

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

    ثم يتحول `/model sonnet` (أو `/<alias>` عند دعمه) إلى معرّف ذلك النموذج.

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

    إذا أشرت إلى مزوّد/نموذج لكن مفتاح المزوّد المطلوب مفقود، فستحصل على خطأ مصادقة وقت التشغيل (مثل `No API key found for provider "zai"`).

    **لم يتم العثور على مفتاح API للمزوّد بعد إضافة وكيل جديد**

    يعني هذا عادةً أن **الوكيل الجديد** لديه مخزن مصادقة فارغ. تكون المصادقة لكل وكيل على حدة
    وتُخزّن في:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    خيارات الإصلاح:

    - شغّل `openclaw agents add <id>` واضبط المصادقة أثناء المعالج.
    - أو انسخ فقط ملفات تعريف `api_key` / `token` الثابتة والقابلة للنقل من مخزن مصادقة الوكيل الرئيسي إلى مخزن مصادقة الوكيل الجديد.
    - بالنسبة إلى ملفات تعريف OAuth، سجّل الدخول من الوكيل الجديد عندما يحتاج إلى حسابه الخاص؛ وإلا يستطيع OpenClaw القراءة عبر الوكيل الافتراضي/الرئيسي من دون استنساخ رموز التحديث.

    لا **تعد** استخدام `agentDir` عبر الوكلاء؛ فهذا يسبب تضاربًا في المصادقة/الجلسات.

  </Accordion>
</AccordionGroup>

## تجاوز فشل النموذج و"فشلت كل النماذج"

<AccordionGroup>
  <Accordion title="كيف يعمل تجاوز الفشل؟">
    يحدث تجاوز الفشل على مرحلتين:

    1. **تدوير ملف تعريف المصادقة** ضمن المزوّد نفسه.
    2. **الرجوع إلى نموذج بديل** وهو النموذج التالي في `agents.defaults.model.fallbacks`.

    تُطبّق فترات تهدئة على الملفات الشخصية الفاشلة (تراجع أسي)، لذلك يستطيع OpenClaw مواصلة الاستجابة حتى عندما يكون المزوّد محدود المعدل أو يفشل مؤقتًا.

    يتضمن وعاء حدود المعدل أكثر من استجابات `429` العادية. يعامل OpenClaw
    أيضًا رسائل مثل `Too many concurrent requests`،
    و`ThrottlingException`، و`concurrency limit reached`،
    و`workers_ai ... quota limit exceeded`، و`resource exhausted`، وحدود
    نوافذ الاستخدام الدورية (`weekly/monthly limit reached`) كحدود معدل
    تستحق تجاوز الفشل.

    بعض الاستجابات التي تبدو متعلقة بالفوترة ليست `402`، كما تبقى بعض استجابات HTTP `402`
    أيضًا في ذلك الوعاء العابر. إذا أعاد مزوّد نص فوترة صريحًا مع `401` أو `403`، فلا يزال OpenClaw قادرًا على إبقائه
    في مسار الفوترة، لكن مطابقات النص الخاصة بالمزوّد تبقى محصورة في
    المزوّد الذي يملكها (على سبيل المثال OpenRouter `Key limit exceeded`). إذا بدت رسالة `402`
    بدلًا من ذلك كنافذة استخدام قابلة لإعادة المحاولة أو
    حد إنفاق مؤسسة/مساحة عمل (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`)، فيعاملها OpenClaw على أنها
    `rate_limit`، وليست تعطيل فوترة طويلًا.

    أخطاء تجاوز السياق مختلفة: تبقى التواقيع مثل
    `request_too_large`، و`input exceeds the maximum number of tokens`،
    و`input token count exceeds the maximum number of input tokens`،
    و`input is too long for the model`، أو `ollama error: context length
    exceeded` على مسار Compaction/إعادة المحاولة بدلًا من الانتقال إلى
    الرجوع إلى نموذج بديل.

    نص أخطاء الخادم العام أضيق عمدًا من "أي شيء يحتوي على
    unknown/error". يعامل OpenClaw الأشكال العابرة المحصورة بالمزوّد
    مثل خطأ Anthropic المجرد `An unknown error occurred`، وخطأ OpenRouter المجرد
    `Provider returned error`، وأخطاء سبب الإيقاف مثل `Unhandled stop reason:
    error`، وحمولات JSON من نوع `api_error` التي تحتوي على نص خادم عابر
    (`internal server error`، و`unknown error, 520`، و`upstream error`، و`backend
    error`)، وأخطاء انشغال المزوّد مثل `ModelNotReadyException` كإشارات
    مهلة/تحميل زائد تستحق تجاوز الفشل عندما يطابق سياق المزوّد.
    نص الرجوع الداخلي العام مثل `LLM request failed with an unknown
    error.` يبقى محافظًا ولا يشغّل الرجوع إلى نموذج بديل بمفرده.

  </Accordion>

  <Accordion title='ماذا يعني "No credentials found for profile anthropic:default"؟'>
    يعني هذا أن النظام حاول استخدام معرّف ملف تعريف المصادقة `anthropic:default`، لكنه لم يتمكن من العثور على بيانات اعتماده في مخزن المصادقة المتوقع.

    **قائمة تحقق للإصلاح:**

    - **تأكد من مكان وجود ملفات تعريف المصادقة** (المسارات الجديدة مقابل القديمة)
      - الحالي: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - القديم: `~/.openclaw/agent/*` (يهاجره `openclaw doctor`)
    - **تأكد من تحميل متغير البيئة لديك بواسطة Gateway**
      - إذا ضبطت `ANTHROPIC_API_KEY` في الصدفة لديك لكنك تشغّل Gateway عبر systemd/launchd، فقد لا يرثه. ضعه في `~/.openclaw/.env` أو فعّل `env.shellEnv`.
    - **تأكد من أنك تعدّل الوكيل الصحيح**
      - تعني إعدادات الوكلاء المتعددة إمكانية وجود عدة ملفات `auth-profiles.json`.
    - **تحقق بشكل سريع من حالة النموذج/المصادقة**
      - استخدم `openclaw models status` لرؤية النماذج المضبوطة وما إذا كان المزوّدون موثّقين.

    **قائمة تحقق للإصلاح من أجل "No credentials found for profile anthropic"**

    يعني هذا أن التشغيل مثبّت على ملف تعريف مصادقة Anthropic، لكن Gateway
    لا يستطيع العثور عليه في مخزن المصادقة الخاص به.

    - **استخدم Claude CLI**
      - شغّل `openclaw models auth login --provider anthropic --method cli --set-default` على مضيف Gateway.
    - **إذا كنت تريد استخدام مفتاح API بدلًا من ذلك**
      - ضع `ANTHROPIC_API_KEY` في `~/.openclaw/.env` على **مضيف Gateway**.
      - امسح أي ترتيب مثبّت يفرض ملفًا شخصيًا مفقودًا:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **تأكد من أنك تشغّل الأوامر على مضيف Gateway**
      - في الوضع البعيد، تعيش ملفات تعريف المصادقة على جهاز Gateway، وليس على حاسوبك المحمول.

  </Accordion>

  <Accordion title="لماذا حاول أيضًا استخدام Google Gemini وفشل؟">
    إذا كان إعداد النموذج لديك يتضمن Google Gemini كخيار رجوع (أو انتقلت إلى اختصار Gemini)، فسيحاول OpenClaw استخدامه أثناء الرجوع إلى نموذج بديل. إذا لم تكن قد ضبطت بيانات اعتماد Google، فسترى `No API key found for provider "google"`.

    الإصلاح: إما توفير مصادقة Google، أو إزالة/تجنب نماذج Google في `agents.defaults.model.fallbacks` / الأسماء المستعارة حتى لا يوجّه الرجوع إليها.

    **رُفض طلب LLM: توقيع التفكير مطلوب (Google Antigravity)**

    السبب: يحتوي سجل الجلسة على **كتل تفكير بلا تواقيع** (غالبًا من
    تدفق أُجهض/جزئي). يتطلب Google Antigravity تواقيع لكتل التفكير.

    الإصلاح: يزيل OpenClaw الآن كتل التفكير غير الموقعة لـ Google Antigravity Claude. إذا استمر ظهور ذلك، فابدأ **جلسة جديدة** أو اضبط `/thinking off` لذلك الوكيل.

  </Accordion>
</AccordionGroup>

## ملفات تعريف المصادقة: ما هي وكيف تديرها

ذو صلة: [/concepts/oauth](/ar/concepts/oauth) (تدفقات OAuth، تخزين الرموز، أنماط الحسابات المتعددة)

<AccordionGroup>
  <Accordion title="ما ملف تعريف المصادقة؟">
    ملف تعريف المصادقة هو سجل بيانات اعتماد مسمّى (OAuth أو مفتاح API) مرتبط بمزوّد. تعيش الملفات الشخصية في:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    لفحص الملفات الشخصية المحفوظة من دون كشف الأسرار، شغّل `openclaw models auth list` (اختياريًا `--provider <id>` أو `--json`). راجع [Models CLI](/ar/cli/models#auth-profiles) للتفاصيل.

  </Accordion>

  <Accordion title="ما معرّفات الملفات الشخصية النموذجية؟">
    يستخدم OpenClaw معرّفات مسبوقة بالمزوّد مثل:

    - `anthropic:default` (شائع عندما لا توجد هوية بريد إلكتروني)
    - `anthropic:<email>` لهويات OAuth
    - معرّفات مخصصة تختارها (مثل `anthropic:work`)

  </Accordion>

  <Accordion title="هل يمكنني التحكم في ملف تعريف المصادقة الذي يُجرَّب أولًا؟">
    نعم. يدعم الإعداد بيانات وصفية اختيارية للملفات الشخصية وترتيبًا لكل مزوّد (`auth.order.<provider>`). هذا لا **يخزّن** أسرارًا؛ بل يربط المعرّفات بالمزوّد/الوضع ويضبط ترتيب التدوير.

    قد يتخطى OpenClaw ملفًا شخصيًا مؤقتًا إذا كان في **فترة تهدئة** قصيرة (حدود معدل/مهلات/فشل مصادقة) أو في حالة **تعطيل** أطول (فوترة/أرصدة غير كافية). لفحص ذلك، شغّل `openclaw models status --json` وتحقق من `auth.unusableProfiles`. الضبط: `auth.cooldowns.billingBackoffHours*`.

    يمكن أن تكون فترات تهدئة حدود المعدل مرتبطة بالنموذج. يمكن أن يبقى ملف شخصي في فترة تهدئة
    لنموذج واحد قابلًا للاستخدام لنموذج شقيق على المزوّد نفسه،
    بينما تبقى نوافذ الفوترة/التعطيل حاجبة للملف الشخصي بأكمله.

    يمكنك أيضًا ضبط تجاوز ترتيب **لكل وكيل** (مخزّن في `auth-state.json` لذلك الوكيل) عبر CLI:

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

    إذا حُذف ملف شخصي مخزّن من الترتيب الصريح، فسيعرض الفحص
    `excluded_by_auth_order` لذلك الملف الشخصي بدلًا من تجربته بصمت.

  </Accordion>

  <Accordion title="OAuth مقابل مفتاح API - ما الفرق؟">
    يدعم OpenClaw كليهما:

    - غالبًا ما يستفيد **OAuth** من وصول الاشتراك (حيثما ينطبق ذلك).
    - تستخدم **مفاتيح API** فوترة الدفع لكل رمز.

    يدعم المعالج صراحةً Anthropic Claude CLI، وOpenAI Codex OAuth، ومفاتيح API.

  </Accordion>
</AccordionGroup>

## ذو صلة

- [الأسئلة الشائعة](/ar/help/faq) — الأسئلة الشائعة الرئيسية
- [الأسئلة الشائعة — البدء السريع وإعداد التشغيل الأول](/ar/help/faq-first-run)
- [اختيار النموذج](/ar/concepts/model-providers)
- [تجاوز فشل النموذج](/ar/concepts/model-failover)
