---
read_when:
    - اختيار النماذج أو التبديل بينها، وتهيئة الأسماء المستعارة
    - تصحيح أخطاء تجاوز فشل النماذج / "فشلت كل النماذج"
    - فهم ملفات تعريف المصادقة وكيفية إدارتها
sidebarTitle: Models FAQ
summary: 'الأسئلة الشائعة: الإعدادات الافتراضية للنماذج، والاختيار، والأسماء المستعارة، والتبديل، وتجاوز الفشل، وملفات تعريف المصادقة'
title: 'الأسئلة الشائعة: النماذج والمصادقة'
x-i18n:
    generated_at: "2026-06-28T20:43:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3bfff016fc8b5afff5dde2b939b7fa431aa5a0309aa2833e7dd4675b638ca225
    source_path: help/faq-models.md
    workflow: 16
---

  أسئلة وأجوبة حول النماذج وملفات تعريف المصادقة. للإعداد والجلسات وGateway والقنوات
  واستكشاف الأخطاء وإصلاحها، راجع [الأسئلة الشائعة](/ar/help/faq) الرئيسية.

  ## النماذج: الإعدادات الافتراضية، والاختيار، والأسماء المستعارة، والتبديل

  <AccordionGroup>
  <Accordion title='ما هو "النموذج الافتراضي"؟'>
    النموذج الافتراضي في OpenClaw هو أي نموذج تضبطه كالتالي:

    ```
    agents.defaults.model.primary
    ```

    تتم الإشارة إلى النماذج بصيغة `provider/model` (مثال: `openai/gpt-5.5` أو `anthropic/claude-sonnet-4-6`). إذا حذفت المزوّد، يحاول OpenClaw أولًا استخدام اسم مستعار، ثم مطابقة فريدة لمزوّد مُهيأ لمعرّف النموذج نفسه، وبعد ذلك فقط يعود إلى المزوّد الافتراضي المُهيأ كمسار توافق مهمل. إذا لم يعد ذلك المزوّد يوفّر النموذج الافتراضي المُهيأ، يعود OpenClaw إلى أول مزوّد/نموذج مُهيأ بدلًا من إظهار افتراضي قديم لمزوّد أزيل. مع ذلك، يجب أن تضبط `provider/model` **صراحةً**.

  </Accordion>

  <Accordion title="ما النموذج الذي توصون به؟">
    **الإعداد الافتراضي الموصى به:** استخدم أقوى نموذج من أحدث جيل متاح في حزمة المزوّدين لديك.
    **للوكلاء الممكّنين بالأدوات أو الذين يتعاملون مع مُدخلات غير موثوقة:** أعطِ أولوية لقوة النموذج على التكلفة.
    **للدردشة الروتينية/منخفضة المخاطر:** استخدم نماذج احتياطية أرخص ووجّه حسب دور الوكيل.

    لدى MiniMax وثائق خاصة به: [MiniMax](/ar/providers/minimax) و
    [النماذج المحلية](/ar/gateway/local-models).

    قاعدة عامة: استخدم **أفضل نموذج يمكنك تحمل تكلفته** للأعمال عالية المخاطر، ونموذجًا أرخص
    للدردشة الروتينية أو الملخصات. يمكنك توجيه النماذج لكل وكيل واستخدام الوكلاء الفرعيين
    لموازاة المهام الطويلة (كل وكيل فرعي يستهلك رموزًا). راجع [النماذج](/ar/concepts/models) و
    [الوكلاء الفرعيين](/ar/tools/subagents).

    تحذير قوي: النماذج الأضعف/المكمّمة أكثر من اللازم أكثر عرضة لحقن التعليمات
    والسلوك غير الآمن. راجع [الأمان](/ar/gateway/security).

    مزيد من السياق: [النماذج](/ar/concepts/models).

  </Accordion>

  <Accordion title="كيف أبدّل النماذج دون مسح الإعدادات؟">
    استخدم **أوامر النموذج** أو عدّل حقول **النموذج** فقط. تجنّب استبدال الإعدادات بالكامل.

    خيارات آمنة:

    - `/model` في الدردشة (سريع، لكل جلسة)
    - `openclaw models set ...` (يحدّث إعدادات النموذج فقط)
    - `openclaw configure --section model` (تفاعلي)
    - عدّل `agents.defaults.model` في `~/.openclaw/openclaw.json`

    تجنّب `config.apply` مع كائن جزئي إلا إذا كنت تقصد استبدال الإعدادات كلها.
    لتعديلات RPC، افحص أولًا باستخدام `config.schema.lookup` وفضّل `config.patch`. تمنحك حمولة البحث المسار المطبّع، ووثائق/قيود المخطط السطحية، وملخصات الأبناء المباشرين.
    للتحديثات الجزئية.
    إذا استبدلت الإعدادات فعلًا، فاستعدها من نسخة احتياطية أو أعد تشغيل `openclaw doctor` للإصلاح.

    الوثائق: [النماذج](/ar/concepts/models)، [التهيئة](/ar/cli/configure)، [الإعدادات](/ar/cli/config)، [Doctor](/ar/gateway/doctor).

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

    - يمنحك `Cloud + Local` نماذج سحابية بالإضافة إلى نماذج Ollama المحلية لديك
    - النماذج السحابية مثل `kimi-k2.5:cloud` لا تحتاج إلى سحب محلي
    - للتبديل اليدوي، استخدم `openclaw models list` و`openclaw models set ollama/<model>`

    ملاحظة أمان: النماذج الأصغر أو المكمّمة بشدة أكثر عرضة لحقن التعليمات.
    نوصي بشدة باستخدام **نماذج كبيرة** لأي بوت يمكنه استخدام الأدوات.
    إذا كنت لا تزال تريد نماذج صغيرة، فعّل العزل وقوائم السماح الصارمة للأدوات.

    الوثائق: [Ollama](/ar/providers/ollama)، [النماذج المحلية](/ar/gateway/local-models)،
    [مزوّدو النماذج](/ar/concepts/model-providers)، [الأمان](/ar/gateway/security)،
    [العزل](/ar/gateway/sandboxing).

  </Accordion>

  <Accordion title="ما النماذج التي يستخدمها OpenClaw وFlawd وKrill؟">
    - يمكن أن تختلف هذه النشرات وقد تتغير بمرور الوقت؛ لا توجد توصية ثابتة لمزوّد.
    - تحقق من إعداد التشغيل الحالي على كل gateway باستخدام `openclaw models status`.
    - للوكلاء الحسّاسين أمنيًا/الممكّنين بالأدوات، استخدم أقوى نموذج من أحدث جيل متاح.

  </Accordion>

  <Accordion title="كيف أبدّل النماذج فورًا (دون إعادة التشغيل)؟">
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

    يعرض `/model` (و`/model list`) منتقيًا مرقمًا وموجزًا. اختر بالرقم:

    ```
    /model 3
    ```

    يمكنك أيضًا فرض ملف تعريف مصادقة محدد للمزوّد (لكل جلسة):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    نصيحة: يعرض `/model status` الوكيل النشط، وملف `auth-profiles.json` المستخدم، وملف تعريف المصادقة الذي ستتم تجربته تاليًا.
    كما يعرض نقطة نهاية المزوّد المُهيأة (`baseUrl`) ووضع API (`api`) عند توفرهما.

    **كيف ألغي تثبيت ملف تعريف ضبطته باستخدام @profile؟**

    أعد تشغيل `/model` **من دون** لاحقة `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    إذا أردت الرجوع إلى الافتراضي، فاختره من `/model` (أو أرسل `/model <default provider/model>`).
    استخدم `/model status` لتأكيد ملف تعريف المصادقة النشط.

  </Accordion>

  <Accordion title="إذا كان مزوّدان يعرِضان معرّف النموذج نفسه، فأيهما يستخدم /model؟">
    يختار `/model provider/model` مسار ذلك المزوّد المحدد للجلسة.

    على سبيل المثال، `qianfan/deepseek-v4-flash` و`deepseek/deepseek-v4-flash` هما مرجعان مختلفان للنموذج رغم أن كليهما يحتوي على `deepseek-v4-flash`. يجب ألا يبدّل OpenClaw بصمت من مزوّد إلى آخر لمجرد تطابق معرّف النموذج المجرد.

    يكون مرجع `/model` الذي اختاره المستخدم صارمًا أيضًا لسياسة الرجوع الاحتياطي. إذا لم يكن ذلك المزوّد/النموذج المحدد متاحًا، يفشل الرد بوضوح بدلًا من الإجابة من `agents.defaults.model.fallbacks`. لا تزال سلاسل الرجوع الاحتياطي المُهيأة تنطبق على الإعدادات الافتراضية المُهيأة، والأساسيات الأساسية لمهام Cron، وحالة الرجوع الاحتياطي المختارة تلقائيًا.

    إذا كان يُسمح لتشغيل بدأ من تجاوز غير خاص بالجلسة باستخدام الرجوع الاحتياطي، يجرّب OpenClaw المزوّد/النموذج المطلوب أولًا، ثم خيارات الرجوع الاحتياطي المُهيأة، وبعد ذلك فقط الأساسي المُهيأ. يمنع ذلك معرّفات النماذج المجردة المكررة من القفز مباشرةً إلى المزوّد الافتراضي.

    راجع [النماذج](/ar/concepts/models) و[تجاوز فشل النماذج](/ar/concepts/model-failover).

  </Accordion>

  <Accordion title="هل يمكنني استخدام GPT 5.5 للمهام اليومية وCodex 5.5 للبرمجة؟">
    نعم. تعامل مع اختيار النموذج واختيار وقت التشغيل كأمرين منفصلين:

    - **وكيل البرمجة الأصلي Codex:** اضبط `agents.defaults.model.primary` على `openai/gpt-5.5`. سجّل الدخول باستخدام `openclaw models auth login --provider openai` عندما تريد مصادقة اشتراك ChatGPT/Codex.
    - **مهام OpenAI API المباشرة خارج حلقة الوكيل:** هيّئ `OPENAI_API_KEY` للصور، والتضمينات، والكلام، والوقت الفعلي، وغيرها من أسطح OpenAI API غير الخاصة بالوكيل.
    - **مصادقة مفتاح API لوكيل OpenAI:** استخدم `/model openai/gpt-5.5` مع ملف تعريف مفتاح API مرتب لـ`openai`.
    - **الوكلاء الفرعيون:** وجّه مهام البرمجة إلى وكيل يركز على Codex مع نموذج `openai/gpt-5.5` خاص به.

    راجع [النماذج](/ar/concepts/models) و[أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="كيف أهيئ الوضع السريع لـ GPT 5.5؟">
    استخدم إما تبديلًا للجلسة أو إعدادًا افتراضيًا في الإعدادات:

    - **لكل جلسة:** أرسل `/fast on` أثناء استخدام الجلسة لـ`openai/gpt-5.5`.
    - **افتراضي لكل نموذج:** اضبط `agents.defaults.models["openai/gpt-5.5"].params.fastMode` على `true`.
    - **الحد التلقائي:** استخدم `/fast auto` أو `params.fastMode: "auto"` لبدء استدعاءات النماذج الجديدة بسرعة حتى الحد التلقائي، ثم بدء الاستدعاءات اللاحقة الخاصة بإعادة المحاولة، أو الرجوع الاحتياطي، أو نتيجة الأداة، أو المتابعة من دون الوضع السريع. القيمة الافتراضية للحد هي 60 ثانية؛ اضبط `params.fastAutoOnSeconds` على النموذج النشط لتغييرها.

    مثال:

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

    بالنسبة إلى OpenAI، يطابق الوضع السريع `service_tier = "priority"` في طلبات Responses الأصلية المدعومة. تتفوق تجاوزات `/fast` الخاصة بالجلسة على الإعدادات الافتراضية في الإعدادات. لا يمكن لمنعطفات خادم تطبيق Codex تلقي الطبقة إلا عند بدء المنعطف، لذلك ينطبق `auto` على منعطف النموذج التالي الذي يبدأه OpenClaw بدلًا من داخل منعطف خادم تطبيق قيد التشغيل بالفعل.

    راجع [التفكير والوضع السريع](/ar/tools/thinking) و[الوضع السريع في OpenAI](/ar/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='لماذا أرى "Model ... is not allowed" ثم لا يصل أي رد؟'>
    إذا تم ضبط `agents.defaults.models`، فتصبح **قائمة السماح** لـ`/model` وأي
    تجاوزات للجلسة. اختيار نموذج غير موجود في تلك القائمة يعيد:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    يُعاد هذا الخطأ **بدلًا من** رد عادي. الإصلاح: أضف النموذج المحدد بالضبط إلى
    `agents.defaults.models`، أو أضف حرف بدل للمزوّد مثل `"provider/*": {}` لكتالوجات المزوّد الديناميكية، أو أزِل قائمة السماح، أو اختر نموذجًا من `/model list`.
    إذا تضمن الأمر أيضًا `--runtime codex`، فحدّث قائمة السماح أولًا ثم أعد محاولة
    أمر `/model provider/model --runtime codex` نفسه.

  </Accordion>

  <Accordion title='لماذا أرى "Unknown model: minimax/MiniMax-M3"؟'>
    هذا يعني أن **المزوّد غير مُهيأ** (لم يُعثر على إعداد مزوّد MiniMax أو ملف تعريف
    مصادقة)، لذلك لا يمكن حل النموذج.

    قائمة تحقق الإصلاح:

    1. رقِّ إلى إصدار OpenClaw حالي (أو شغّل من مصدر `main`)، ثم أعد تشغيل gateway.
    2. تأكد من أن MiniMax مُهيأ (المعالج أو JSON)، أو أن مصادقة MiniMax
       موجودة في ملفات تعريف البيئة/المصادقة حتى يمكن حقن المزوّد المطابق
       (`MINIMAX_API_KEY` لـ`minimax`، أو `MINIMAX_OAUTH_TOKEN` أو OAuth مخزن لـMiniMax
       لـ`minimax-portal`).
    3. استخدم معرّف النموذج الدقيق (حساس لحالة الأحرف) لمسار المصادقة لديك:
       `minimax/MiniMax-M3`، أو `minimax/MiniMax-M2.7`، أو
       `minimax/MiniMax-M2.7-highspeed` لإعداد مفتاح API، أو
       `minimax-portal/MiniMax-M3`، أو `minimax-portal/MiniMax-M2.7`، أو
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
    الرجوعات الاحتياطية مخصصة **للأخطاء**، وليس "للمهام الصعبة"، لذا استخدم `/model` أو وكيلًا منفصلًا.

    **الخيار A: التبديل لكل جلسة**

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

    ثم:

    ```
    /model gpt
    ```

    **الخيار B: وكلاء منفصلون**

    - افتراضي الوكيل A: MiniMax
    - افتراضي الوكيل B: OpenAI
    - وجّه حسب الوكيل أو استخدم `/agent` للتبديل

    الوثائق: [النماذج](/ar/concepts/models)، [توجيه الوكلاء المتعددين](/ar/concepts/multi-agent)، [MiniMax](/ar/providers/minimax)، [OpenAI](/ar/providers/openai).

  </Accordion>

  <Accordion title="هل opus / sonnet / gpt اختصارات مدمجة؟">
    نعم. يأتي OpenClaw مع بضعة اختصارات افتراضية (تُطبَّق فقط عندما يكون النموذج موجودًا في `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-8`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite`

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
          },
        },
      },
    }
    ```

    بعد ذلك يُحلّ `/model sonnet` (أو `/<alias>` عند دعمه) إلى معرّف ذلك النموذج.

  </Accordion>

  <Accordion title="كيف أضيف نماذج من مزودين آخرين مثل OpenRouter أو Z.AI؟">
    OpenRouter (الدفع حسب الرموز؛ نماذج كثيرة):

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

    إذا أشرت إلى مزود/نموذج لكن مفتاح المزود المطلوب مفقود، فستحصل على خطأ مصادقة وقت التشغيل (مثل `No API key found for provider "zai"`).

    **لم يُعثر على مفتاح API للمزود بعد إضافة وكيل جديد**

    يعني هذا عادةً أن **الوكيل الجديد** لديه مخزن مصادقة فارغ. المصادقة تكون لكل وكيل وتُخزَّن في:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    خيارات الإصلاح:

    - شغّل `openclaw agents add <id>` وهيّئ المصادقة أثناء المعالج.
    - أو انسخ فقط ملفات تعريف `api_key` / `token` الثابتة القابلة للنقل من مخزن مصادقة الوكيل الرئيسي إلى مخزن مصادقة الوكيل الجديد.
    - بالنسبة إلى ملفات تعريف OAuth، سجّل الدخول من الوكيل الجديد عندما يحتاج إلى حسابه الخاص؛ وإلا يستطيع OpenClaw القراءة عبر الوكيل الافتراضي/الرئيسي دون استنساخ رموز التحديث.

    لا تُعد استخدام `agentDir` بين الوكلاء؛ فهذا يسبب تصادمات في المصادقة/الجلسات.

  </Accordion>
</AccordionGroup>

## تجاوز فشل النموذج و"فشلت كل النماذج"

<AccordionGroup>
  <Accordion title="كيف يعمل تجاوز الفشل؟">
    يحدث تجاوز الفشل على مرحلتين:

    1. **تدوير ملف تعريف المصادقة** ضمن المزود نفسه.
    2. **الرجوع الاحتياطي للنموذج** إلى النموذج التالي في `agents.defaults.model.fallbacks`.

    تُطبَّق فترات تهدئة على الملفات التعريفية الفاشلة (تراجع أسي)، لذلك يمكن لـ OpenClaw مواصلة الاستجابة حتى عندما يكون المزود محدود المعدل أو يفشل مؤقتًا.

    يشمل حاوي حدود المعدل أكثر من استجابات `429` العادية. يتعامل OpenClaw
    أيضًا مع رسائل مثل `Too many concurrent requests`،
    و`ThrottlingException`، و`concurrency limit reached`،
    و`workers_ai ... quota limit exceeded`، و`resource exhausted`، وحدود
    نوافذ الاستخدام الدورية (`weekly/monthly limit reached`) كحدود معدل
    تستحق تجاوز الفشل.

    بعض الاستجابات التي تبدو مرتبطة بالفوترة ليست `402`، وبعض استجابات HTTP `402`
    تبقى أيضًا ضمن ذلك الحاوي المؤقت. إذا أعاد مزود نص فوترة صريحًا مع `401` أو `403`،
    فيمكن لـ OpenClaw إبقاؤه في مسار الفوترة، لكن مطابقات النصوص الخاصة بالمزود تبقى
    محصورة في المزود الذي يملكها (مثل OpenRouter `Key limit exceeded`). أما إذا بدت رسالة `402`
    بدلًا من ذلك كنافذة استخدام قابلة لإعادة المحاولة أو حد إنفاق للمؤسسة/مساحة العمل
    (`daily limit reached, resets tomorrow`، `organization spending limit exceeded`)،
    فيتعامل OpenClaw معها باعتبارها `rate_limit`، لا تعطيل فوترة طويلًا.

    أخطاء فيض السياق مختلفة: تبقى بصمات مثل
    `request_too_large`، و`input exceeds the maximum number of tokens`،
    و`input token count exceeds the maximum number of input tokens`،
    و`input is too long for the model`، أو `ollama error: context length
    exceeded` على مسار Compaction/إعادة المحاولة بدلًا من التقدم إلى الرجوع
    الاحتياطي للنموذج.

    نص خطأ الخادم العام أضيق عمدًا من "أي شيء يحتوي على
    unknown/error". يتعامل OpenClaw فعلًا مع الأشكال المؤقتة المحصورة بالمزود
    مثل Anthropic العارية `An unknown error occurred`، وOpenRouter العارية
    `Provider returned error`، وأخطاء سبب الإيقاف مثل `Unhandled stop reason:
    error`، وحمولات JSON `api_error` التي تحتوي على نص خادم مؤقت
    (`internal server error`، و`unknown error, 520`، و`upstream error`، و`backend
    error`)، وأخطاء انشغال المزود مثل `ModelNotReadyException` على أنها
    إشارات انتهاء مهلة/تحميل زائد تستحق تجاوز الفشل عندما يطابق سياق المزود.
    يبقى نص الرجوع الاحتياطي الداخلي العام مثل `LLM request failed with an unknown
    error.` محافظًا ولا يطلق الرجوع الاحتياطي للنموذج بحد ذاته.

  </Accordion>

  <Accordion title='ماذا يعني "No credentials found for profile anthropic:default"؟'>
    يعني أن النظام حاول استخدام معرّف ملف تعريف المصادقة `anthropic:default`، لكنه لم يجد بيانات اعتماد له في مخزن المصادقة المتوقع.

    **قائمة تحقق الإصلاح:**

    - **تأكد من مكان وجود ملفات تعريف المصادقة** (المسارات الجديدة مقابل القديمة)
      - الحالي: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - القديم: `~/.openclaw/agent/*` (يُرحَّل بواسطة `openclaw doctor`)
    - **تأكد من أن متغير البيئة لديك محمّل بواسطة Gateway**
      - إذا ضبطت `ANTHROPIC_API_KEY` في الصدفة لديك لكنك تشغّل Gateway عبر systemd/launchd، فقد لا يرثه. ضعه في `~/.openclaw/.env` أو فعّل `env.shellEnv`.
    - **تأكد من أنك تعدّل الوكيل الصحيح**
      - تعني إعدادات الوكلاء المتعددين أنه قد توجد عدة ملفات `auth-profiles.json`.
    - **تحقق سريعًا من حالة النموذج/المصادقة**
      - استخدم `openclaw models status` لرؤية النماذج المهيأة وما إذا كان المزودون مصادقين.

    **قائمة تحقق الإصلاح لـ "No credentials found for profile anthropic"**

    يعني هذا أن التشغيل مثبت على ملف تعريف مصادقة Anthropic، لكن Gateway
    لا يستطيع العثور عليه في مخزن المصادقة الخاص به.

    - **استخدم Claude CLI**
      - شغّل `openclaw models auth login --provider anthropic --method cli --set-default` على مضيف Gateway.
    - **إذا كنت تريد استخدام مفتاح API بدلًا من ذلك**
      - ضع `ANTHROPIC_API_KEY` في `~/.openclaw/.env` على **مضيف Gateway**.
      - امسح أي ترتيب مثبت يفرض ملفًا تعريفيًا مفقودًا:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **تأكد من أنك تشغّل الأوامر على مضيف Gateway**
      - في الوضع البعيد، تعيش ملفات تعريف المصادقة على جهاز Gateway، وليس على حاسوبك المحمول.

  </Accordion>

  <Accordion title="لماذا حاول أيضًا استخدام Google Gemini وفشل؟">
    إذا كان تكوين النموذج لديك يتضمن Google Gemini كخيار رجوع احتياطي (أو بدّلت إلى اختصار Gemini)، فسيحاول OpenClaw استخدامه أثناء الرجوع الاحتياطي للنموذج. إذا لم تكن قد هيأت بيانات اعتماد Google، فسترى `No API key found for provider "google"`.

    الإصلاح: إما أن توفر مصادقة Google، أو تزيل/تتجنب نماذج Google في `agents.defaults.model.fallbacks` / الأسماء المستعارة حتى لا يوجّه الرجوع الاحتياطي إليها.

    **رُفض طلب LLM: توقيع التفكير مطلوب (Google Antigravity)**

    السبب: يحتوي تاريخ الجلسة على **كتل تفكير بلا تواقيع** (غالبًا من
    دفق مُجهض/جزئي). يتطلب Google Antigravity تواقيع لكتل التفكير.

    الإصلاح: يزيل OpenClaw الآن كتل التفكير غير الموقعة لـ Google Antigravity Claude. إذا استمرت في الظهور، فابدأ **جلسة جديدة** أو اضبط `/thinking off` لذلك الوكيل.

  </Accordion>
</AccordionGroup>

## ملفات تعريف المصادقة: ما هي وكيف تديرها

ذو صلة: [/concepts/oauth](/ar/concepts/oauth) (تدفقات OAuth، تخزين الرموز، أنماط الحسابات المتعددة)

<AccordionGroup>
  <Accordion title="ما ملف تعريف المصادقة؟">
    ملف تعريف المصادقة هو سجل بيانات اعتماد مسمى (OAuth أو مفتاح API) مرتبط بمزود. تعيش الملفات التعريفية في:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    لفحص الملفات التعريفية المحفوظة دون كشف الأسرار، شغّل `openclaw models auth list` (اختياريًا `--provider <id>` أو `--json`). راجع [Models CLI](/ar/cli/models#auth-profiles) للتفاصيل.

  </Accordion>

  <Accordion title="ما معرّفات الملفات التعريفية النموذجية؟">
    يستخدم OpenClaw معرّفات مسبوقة بالمزود مثل:

    - `anthropic:default` (شائع عندما لا توجد هوية بريد إلكتروني)
    - `anthropic:<email>` لهويات OAuth
    - معرّفات مخصصة تختارها (مثل `anthropic:work`)

  </Accordion>

  <Accordion title="هل يمكنني التحكم في ملف تعريف المصادقة الذي يُجرَّب أولًا؟">
    نعم. يدعم التكوين بيانات وصفية اختيارية للملفات التعريفية وترتيبًا لكل مزود (`auth.order.<provider>`). هذا لا يخزن أسرارًا؛ بل يربط المعرّفات بالمزود/الوضع ويضبط ترتيب التدوير.

    قد يتخطى OpenClaw ملفًا تعريفيًا مؤقتًا إذا كان في **فترة تهدئة** قصيرة (حدود معدل/انتهاء مهل/إخفاقات مصادقة) أو حالة **معطلة** أطول (فوترة/أرصدة غير كافية). لفحص ذلك، شغّل `openclaw models status --json` وتحقق من `auth.unusableProfiles`. الضبط: `auth.cooldowns.billingBackoffHours*`.

    يمكن أن تكون فترات تهدئة حدود المعدل محصورة بالنموذج. قد يبقى ملف تعريفي في فترة تهدئة
    لنموذج واحد قابلًا للاستخدام لنموذج شقيق على المزود نفسه،
    بينما تستمر نوافذ الفوترة/التعطيل في حظر الملف التعريفي كله.

    يمكنك أيضًا ضبط تجاوز ترتيب **لكل وكيل** (مخزن في `auth-state.json` لذلك الوكيل) عبر CLI:

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

    إذا أُغفل ملف تعريفي مخزن من الترتيب الصريح، فسيبلغ الفحص
    عن `excluded_by_auth_order` لذلك الملف التعريفي بدلًا من تجربته بصمت.

  </Accordion>

  <Accordion title="OAuth مقابل مفتاح API - ما الفرق؟">
    يدعم OpenClaw كليهما:

    - غالبًا ما يستفيد **تسجيل الدخول عبر OAuth / CLI** من وصول الاشتراك حيثما
      يدعمه المزود. بالنسبة إلى Anthropic، تستخدم واجهة Claude CLI الخلفية في OpenClaw
      الأمر Claude Code `claude -p`؛ وتعامل Anthropic ذلك حاليًا باعتباره استخدام Agent
      SDK/برمجيًا. أوقفت Anthropic مؤقتًا تغيير أرصدة Agent
      SDK المنفصل بتاريخ 15 يونيو 2026، لذلك في الوقت الحالي لا يزال هذا يُسحب من حدود
      استخدام الاشتراك. راجع [مقالة خطة Agent SDK من Anthropic](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
      للاطلاع على إشعار الإيقاف المؤقت الحالي.
    - تستخدم **مفاتيح API** فوترة الدفع حسب الرموز.

    يدعم المعالج صراحةً Anthropic Claude CLI، وOpenAI Codex OAuth، ومفاتيح API.

  </Accordion>
</AccordionGroup>

## ذو صلة

- [الأسئلة الشائعة](/ar/help/faq) — الأسئلة الشائعة الرئيسية
- [الأسئلة الشائعة — البدء السريع وإعداد التشغيل الأول](/ar/help/faq-first-run)
- [اختيار النموذج](/ar/concepts/model-providers)
- [التحويل عند فشل النموذج](/ar/concepts/model-failover)
