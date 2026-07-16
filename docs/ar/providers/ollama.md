---
read_when:
    - تريد تشغيل OpenClaw باستخدام نماذج سحابية أو محلية عبر Ollama
    - تحتاج إلى إرشادات إعداد Ollama وتهيئته
    - تريد استخدام نماذج الرؤية من Ollama لفهم الصور
summary: شغّل OpenClaw باستخدام Ollama (النماذج السحابية والمحلية)
title: Ollama
x-i18n:
    generated_at: "2026-07-16T14:44:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9cde30d5b713be4c51e8a98fb7a380f856dca8a611b4b0adfe8e40cd738105fa
    source_path: providers/ollama.md
    workflow: 16
---

يتصل OpenClaw بواجهة API الأصلية لـ Ollama ‏(`/api/chat`)، وليس بنقطة النهاية المتوافقة مع OpenAI
‏`/v1`. هناك ثلاثة أوضاع مدعومة:

| الوضع          | ما يستخدمه                                                                     |
| ------------- | -------------------------------------------------------------------------------- |
| السحابة + المحلي | مضيف Ollama يمكن الوصول إليه، يقدّم نماذج محلية ونماذج `:cloud` (إذا كان مسجّلًا الدخول) |
| السحابة فقط    | ‏`https://ollama.com` مباشرةً، من دون عفريت محلي                                   |
| المحلي فقط    | مضيف Ollama يمكن الوصول إليه، والنماذج المحلية فقط                                       |

لإعداد السحابة فقط باستخدام معرّف المزوّد المخصص `ollama-cloud`، راجع
[سحابة Ollama](/ar/providers/ollama-cloud). استخدم مراجع `ollama-cloud/<model>` عندما
تريد إبقاء توجيه السحابة منفصلًا عن مزوّد `ollama` محلي.

<Warning>
لا تستخدم عنوان URL المتوافق مع OpenAI ‏`/v1` ‏(`http://host:11434/v1`). فهو يعطّل استدعاء الأدوات، وقد تُصدر النماذج JSON خامًا لاستدعاء الأدوات كنص عادي. استخدم عنوان URL الأصلي: `baseUrl: "http://host:11434"` (من دون `/v1`).
</Warning>

مفتاح الإعداد الأساسي هو `baseUrl`. ويُقبل `baseURL` أيضًا في
الأمثلة بأسلوب OpenAI SDK، لكن ينبغي للإعدادات الجديدة استخدام `baseUrl`.

## قواعد المصادقة

<AccordionGroup>
  <Accordion title="المضيفون المحليون ومضيفو LAN">
    لا تحتاج عناوين URL الخاصة بـ Ollama التي تستخدم واجهة الاسترجاع، أو الشبكة الخاصة، أو `.local`، أو اسم مضيف مجردًا إلى رمز حامل حقيقي. يستخدم OpenClaw العلامة `ollama-local` لهذه الحالات.
  </Accordion>
  <Accordion title="المضيفون البعيدون ومضيفو سحابة Ollama">
    تتطلب المضيفات العامة البعيدة و`https://ollama.com` بيانات اعتماد حقيقية: `OLLAMA_API_KEY`، أو ملف تعريف مصادقة، أو `apiKey` الخاص بالمزوّد. للاستخدام المستضاف المباشر، يُفضّل مزوّد `ollama-cloud`.
  </Accordion>
  <Accordion title="معرّفات المزوّدين المخصصة">
    يتبع المزوّد المخصص الذي يحتوي على `api: "ollama"` القواعد نفسها. على سبيل المثال، يمكن لمزوّد `ollama-remote` موجّه إلى مضيف LAN خاص استخدام `apiKey: "ollama-local"`؛ وتحل الوكلاء الفرعيون هذه العلامة عبر خطاف مزوّد Ollama بدلًا من معاملتها كبيانات اعتماد مفقودة. يمكن أيضًا أن يشير `agents.defaults.memorySearch.provider` إلى معرّف مزوّد مخصص لكي تستخدم التضمينات نقطة نهاية Ollama تلك.
  </Accordion>
  <Accordion title="ملفات تعريف المصادقة">
    يخزّن `auth-profiles.json` بيانات الاعتماد لمعرّف مزوّد؛ ضع إعدادات نقطة النهاية (`baseUrl`، و`api`، والنماذج، والترويسات، والمهل الزمنية) في `models.providers.<id>`. الملفات المسطحة الأقدم مثل `{ "ollama-windows": { "apiKey": "ollama-local" } }` ليست تنسيقًا لوقت التشغيل؛ يعيد `openclaw doctor --fix` كتابتها في ملف تعريف أساسي لمفتاح API باسم `ollama-windows:default` مع نسخة احتياطية. تمثّل قيمة `baseUrl` في ذلك الملف القديم بيانات زائدة، وينبغي نقلها إلى إعدادات المزوّد.
  </Accordion>
  <Accordion title="نطاق تضمين الذاكرة">
    تقتصر مصادقة الحامل لتضمينات ذاكرة Ollama على المضيف الذي أُعلن عنها له:

    - لا يُرسل مفتاح على مستوى المزوّد إلا إلى مضيف ذلك المزوّد.
    - لا يُرسل `agents.*.memorySearch.remote.apiKey` إلا إلى مضيف التضمين البعيد الخاص به.
    - تُعامل قيمة بيئة `OLLAMA_API_KEY` الصرفة باعتبارها اصطلاح سحابة Ollama، ولا تُرسل افتراضيًا إلى المضيفين المحليين أو المستضافين ذاتيًا.

  </Accordion>
</AccordionGroup>

## بدء الاستخدام

<Tabs>
  <Tab title="الإعداد الأولي (موصى به)">
    <Steps>
      <Step title="تشغيل الإعداد الأولي">
        ```bash
        openclaw onboard
        ```

        حدّد **Ollama**، ثم اختر وضعًا: **السحابة + المحلي** أو **السحابة فقط** أو **المحلي فقط**.

        في إعداد إرشادي جديد، يتحقق OpenClaw أولًا من مضيف
        Ollama الافتراضي أو المضبوط. إذا أعلن نموذج مثبّت عن دعم الأدوات، فإن تسلسل
        إعداد CLI/macOS المشترك يقدّمه فورًا ويتحقق منه عبر
        إكمال حقيقي. لا يسحب هذا الفحص التلقائي أي نموذج مطلقًا؛ وإذا لم يوجد
        نموذج مثبّت مناسب، يستمر الإعداد الأولي إلى منتقي Ollama المعتاد.
      </Step>
      <Step title="تحديد نموذج">
        يطلب `Cloud only` إدخال `OLLAMA_API_KEY` ويقترح الإعدادات الافتراضية المستضافة في السحابة. يطلب `Cloud + Local` و`Local only` عنوان URL أساسيًا لـ Ollama، ويكتشفان النماذج المتاحة، ويسحبان النموذج المحلي المحدد تلقائيًا إذا كان مفقودًا. تظهر علامة `:latest` مثبّتة مثل `gemma4:latest` مرة واحدة بدلًا من تكرار `gemma4`. ويتحقق `Cloud + Local` أيضًا مما إذا كان المضيف مسجّلًا الدخول للوصول إلى السحابة.
      </Step>
      <Step title="التحقق">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    غير تفاعلي:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

    ‏`--custom-base-url` و`--custom-model-id` اختياريان؛ ويؤدي حذفهما إلى استخدام المضيف المحلي الافتراضي والنموذج المقترح `gemma4`.

  </Tab>

  <Tab title="الإعداد اليدوي">
    <Steps>
      <Step title="تثبيت Ollama وتشغيله">
        احصل عليه من [ollama.com/download](https://ollama.com/download)، ثم اسحب نموذجًا:

        ```bash
        ollama pull gemma4
        ```

        للوصول الهجين إلى السحابة، شغّل `ollama signin` على المضيف نفسه.
      </Step>
      <Step title="تعيين بيانات اعتماد">
        ```bash
        export OLLAMA_API_KEY="ollama-local"    # المضيف المحلي/مضيف LAN، تصلح أي قيمة
        export OLLAMA_API_KEY="your-real-key"   # https://ollama.com فقط
        ```

        أو في الإعدادات: `openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"`.
      </Step>
      <Step title="تحديد النموذج">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        أو في الإعدادات:

        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "ollama/gemma4" },
            },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## نماذج السحابة عبر مضيف محلي

يوجّه `Cloud + Local` النماذج المحلية ونماذج `:cloud` عبر مضيف
Ollama واحد يمكن الوصول إليه — وهذا هو التدفق الهجين لـ Ollama والوضع الذي ينبغي اختياره أثناء الإعداد
عندما تريد كليهما.

يطلب OpenClaw عنوان URL الأساسي، ويكتشف النماذج المحلية، ويتحقق من
حالة `ollama signin`. عند تسجيل الدخول، يقترح الإعدادات الافتراضية المستضافة
(`kimi-k2.5:cloud`، و`minimax-m2.7:cloud`، و`glm-5.1:cloud`، و`glm-5.2:cloud`). وإذا
لم يكن مسجّلًا الدخول، يظل الإعداد محليًا فقط إلى أن تشغّل `ollama signin`.

للوصول إلى السحابة فقط من دون عفريت محلي، استخدم `openclaw onboard --auth-choice ollama-cloud` وراجع [سحابة Ollama](/ar/providers/ollama-cloud) — لا يحتاج هذا المسار إلى `ollama signin` أو خادم قيد التشغيل:

```bash
openclaw onboard --auth-choice ollama-cloud
openclaw models set ollama-cloud/kimi-k2.5:cloud
```

تُملأ قائمة نماذج السحابة المعروضة أثناء `openclaw onboard` مباشرةً من
`https://ollama.com/api/tags`، بحد أقصى 500 إدخال، لكي يعكس المنتقي
الكتالوج المستضاف الحالي. إذا تعذر الوصول إلى `ollama.com` أو لم يُرجع أي
نماذج وقت الإعداد، يعود OpenClaw إلى قائمته المقترحة المضمنة في الشيفرة لكي
يكتمل الإعداد الأولي رغم ذلك.

## اكتشاف النماذج (المزوّد الضمني)

عند تعيين `OLLAMA_API_KEY` (أو ملف تعريف مصادقة) وعدم تعريف
`models.providers.ollama` أو أي مزوّد مخصص آخر يحتوي على `api: "ollama"`،
يكتشف OpenClaw النماذج من `http://127.0.0.1:11434`:

| السلوك             | التفاصيل                                                                                                                                                                                                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| استعلام الكتالوج        | `/api/tags`                                                                                                                                                                                                                                                                                   |
| اكتشاف الإمكانات | تقرأ عملية `/api/show` بأفضل جهد ممكن `contextWindow`، ومعلمات Modelfile في `num_ctx`، والإمكانات (الرؤية/الأدوات/التفكير)                                                                                                                                                                       |
| نماذج الرؤية        | تشير إمكانية `vision` من `/api/show` إلى أن النموذج يدعم الصور (`input: ["text", "image"]`)                                                                                                                                                                                             |
| اكتشاف الاستدلال  | يستخدم إمكانية `thinking` من `/api/show` عند توفرها؛ ويعود إلى استدلال تقريبي بالاسم (`r1`، و`reason`، و`reasoning`، و`think`) عندما يحذف Ollama الإمكانات. ويُعامل `glm-5.2:cloud` و`deepseek-v4-flash\|pro:cloud` دائمًا كنماذج استدلال بغض النظر عن الإمكانات المبلّغ عنها. |
| حدود الرموز         | تكون قيمة `maxTokens` افتراضيًا الحد الأقصى للرموز في Ollama لدى OpenClaw                                                                                                                                                                                                                                       |
| التكاليف                | جميع التكاليف هي `0`                                                                                                                                                                                                                                                                             |

```bash
ollama list
openclaw models list
```

يؤدي تعيين `models.providers.ollama` مع مصفوفة `models` صريحة، أو
مزوّد مخصص يحتوي على `api: "ollama"` وقيمة `baseUrl` ليست واجهة استرجاع، إلى تعطيل
الاكتشاف التلقائي؛ وعندئذ يجب تعريف النماذج يدويًا (راجع
[الإعدادات](#configuration)). كما يتخطى إدخال `models.providers.ollama` موجّه إلى
`https://ollama.com` المستضاف عملية الاكتشاف، لأن نماذج سحابة Ollama
يديرها المزوّد. وتظل المزوّدات المخصصة ذات واجهة الاسترجاع، مثل
`http://127.0.0.2:11434`، محسوبة كمحلية وتبقي الاكتشاف التلقائي مفعّلًا.

يمكن استخدام مرجع كامل مثل `ollama/<pulled-model>:latest` من دون إدخال
`models.json` مكتوب يدويًا؛ إذ يحلّه OpenClaw مباشرةً. بالنسبة إلى المضيفين
المسجّلين الدخول، يؤدي تحديد مرجع `ollama/<model>:cloud` غير مدرج إلى التحقق من ذلك
النموذج المحدد باستخدام `/api/show` وإضافته إلى كتالوج وقت التشغيل فقط إذا أكّد Ollama
البيانات الوصفية — وتظل الأخطاء الإملائية تفشل باعتبارها نماذج غير معروفة.

### اختبارات الدخان

لإجراء فحص نصي محدود يتخطى سطح أدوات الوكيل الكامل:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "أجب بهذه الكلمة فقط: pong" \
    --json
```

أضف `--file` مع صورة لإجراء فحص مبسط لنموذج رؤية (يقبل PNG/JPEG/WebP؛
وتُرفض الملفات غير المصورة قبل استدعاء Ollama — استخدم
`openclaw infer audio transcribe` للصوت):

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "صِف هذه الصورة في جملة واحدة." \
    --file ./photo.jpg \
    --json
```

لا يحمّل أي من المسارين أدوات الدردشة أو الذاكرة أو سياق الجلسة. إذا نجح
بينما تفشل ردود الوكيل العادية، فمن المرجح أن تكون المشكلة في قدرة النموذج على الأدوات/الوكيل،
وليست في نقطة النهاية.

يُعد تحديد نموذج باستخدام `/model ollama/<model>` اختيارًا صريحًا من المستخدم: إذا تعذر
الوصول إلى `baseUrl` المضبوط، يفشل الرد التالي بخطأ المزوّد
بدلًا من الرجوع بصمت إلى نموذج آخر مضبوط.

تضيف مهام Cron المعزولة فحص أمان محليًا واحدًا قبل بدء دورة الوكيل:
إذا تحوّل النموذج المحدد إلى موفّر Ollama محلي/على شبكة خاصة/`.local`
وكان `/api/tags` غير قابل للوصول، يسجّل OpenClaw ذلك التشغيل بوصفه
`skipped` مع تضمين النموذج في نص الخطأ. يُخزَّن فحص نقطة النهاية هذا مؤقتًا
لمدة 5 دقائق لكل مضيف، بحيث لا تطلق مهام Cron المتكررة الموجّهة إلى برنامج خفي متوقف
طلبات فاشلة جميعها.

التحقق المباشر:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

بالنسبة إلى Ollama Cloud، وجّه الاختبار المباشر نفسه إلى نقطة النهاية المستضافة (يتخطى
التضمينات افتراضيًا؛ افرضها باستخدام `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` لأن
مفتاح السحابة قد لا يصرّح بـ `/api/embed`):

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

لإضافة نموذج، اسحبه وسيُكتشف تلقائيًا:

```bash
ollama pull mistral
```

## الاستدلال المحلي على Node

يمكن للوكلاء تفويض مهمة قصيرة إلى نموذج Ollama على سطح مكتب مقترن أو
Node خادم. تنتقل المطالبة والاستجابة عبر اتصال
Gateway/Node الموثّق الحالي؛ ويُنفَّذ الطلب على نقطة نهاية Ollama
ذات الاسترجاع الحلقي الخاصة بالـ Node (`http://127.0.0.1:11434`).

<Steps>
  <Step title="بدء Ollama على الـ Node">
    ```bash
    ollama pull qwen3:0.6b
    ollama list
    ```
  </Step>
  <Step title="توصيل مضيف الـ Node">
    ```bash
    openclaw node run \
      --host <gateway-host> \
      --port 18789 \
      --display-name "Local inference"
    ```

    وافق على الجهاز وأوامر الـ Node الخاصة به على مضيف Gateway، ثم تحقّق:

    ```bash
    openclaw devices list
    openclaw devices approve <deviceRequestId>
    openclaw nodes pending
    openclaw nodes approve <nodeRequestId>
    openclaw nodes status --connected
    ```

    قد يؤدي الاتصال الأول، أو الترقية التي تضيف أوامر Ollama، إلى طلب
    الموافقة على أوامر الـ Node. إذا اتصلت الـ Node من دون الإعلان عن
    `ollama.models` و`ollama.chat`، فتحقّق من `openclaw nodes pending` مرة أخرى.

  </Step>
  <Step title="استخدامه من وكيل">
    يوفّر Plugin ‏Ollama المضمّن الأداة `node_inference`. يستدعي الوكلاء
    `action: "discover"` أولًا، ثم `action: "run"` باستخدام Node ونموذج من
    تلك النتيجة (يمكن لـ `run` حذف الـ Node عندما تكون هناك Node واحدة مؤهلة
    متصلة بالضبط). على سبيل المثال: "اكتشف نماذج Ollama على عُقدي، ثم استخدم
    أسرع نموذج محمّل لتلخيص هذا النص."
  </Step>
</Steps>

تقرأ عملية الاكتشاف `/api/tags`، وتتحقق من إمكانات `/api/show`، وتستخدم
`/api/ps` عند توفره لترتيب النماذج المحمّلة بالفعل أولًا. ولا تعيد إلا
النماذج المحلية التي يبلّغ Ollama بأنها تدعم المحادثة (إمكانية `completion`) —
وتُستبعد صفوف Ollama Cloud والنماذج المخصصة للتضمين فقط. يعطّل كل تشغيل
تفكير النموذج ويجعل المخرجات افتراضيًا 512 رمزًا (بحد أقصى صارم 8192)، ما لم
يطلب استدعاء الأداة `maxTokens` مختلفًا؛ بعض النماذج (مثل GPT-OSS)
لا تدعم تعطيل التفكير وقد تستمر في إصدار رموز الاستدلال.

لإبقاء Ollama قيد التشغيل على Node من دون إتاحته للوكلاء:

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

أعد تشغيل الـ Node ‏(`openclaw node restart`، أو أوقف `openclaw node run` وأعد تشغيله
لجلسة في الواجهة الأمامية). تتوقف الـ Node عن الإعلان عن `ollama.models` و
`ollama.chat`؛ ولا يتأثر Ollama نفسه ولا موفّر Ollama الخاص بـ Gateway.
أعد القيمة إلى `true` وأعد التشغيل لإعادة التمكين؛ وقد يحتاج سطح أوامر
متغيّر إلى موافقة `openclaw nodes pending` مرة أخرى بعد إعادة الاتصال.

تحقّق من أوامر الـ Node مباشرةً، من دون دورة وكيل:

```bash
openclaw nodes invoke \
  --node "Local inference" \
  --command ollama.models \
  --params '{}' \
  --invoke-timeout 90000 \
  --timeout 100000

openclaw nodes invoke \
  --node "Local inference" \
  --command ollama.chat \
  --params '{"model":"qwen3:0.6b","prompt":"Reply with exactly: pong","maxTokens":32,"timeoutMs":120000}' \
  --invoke-timeout 130000 \
  --timeout 140000
```

يحدّد `--invoke-timeout` المدة المتاحة للـ Node لتشغيل الأمر؛
ويحدّد `--timeout` المدة الإجمالية لاستدعاء Gateway ويجب أن يكون أكبر.

يستخدم الاستدلال المحلي على Node دائمًا نقطة نهاية الاسترجاع الحلقي الخاصة بالـ Node نفسها — ولا
يعيد استخدام `models.providers.ollama.baseUrl` بعيد/سحابي مهيّأ. تتوفر
أوامر الـ Node افتراضيًا على مضيفي Node بنظام macOS وLinux وWindows،
وتظل خاضعة لسياسة الاقتران/الأوامر المعتادة للـ Node.

## الرؤية ووصف الصور

يسجّل Plugin ‏Ollama المضمّن Ollama بوصفه موفّرًا لفهم الوسائط
يدعم الصور، بحيث يمكن لـ OpenClaw توجيه طلبات وصف الصور الصريحة
والإعدادات الافتراضية لنماذج الصور المهيّأة عبر نماذج الرؤية المحلية أو المستضافة في Ollama.

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

يجب أن يكون `--model` مرجع `<provider/model>` كاملًا؛ وعند تعيينه، يحاول `infer image
describe` استخدام ذلك النموذج أولًا بدلًا من تخطي الوصف للنماذج
التي تدعم الرؤية الأصلية بالفعل. إذا فشل الاستدعاء، يمكن لـ OpenClaw المتابعة
عبر `agents.defaults.imageModel.fallbacks`؛ وتفشل أخطاء إعداد الملف/عنوان URL
قبل محاولة الرجوع الاحتياطي. استخدم `infer image describe` لمسار
فهم الصور في OpenClaw و`imageModel` المهيّأ؛ واستخدم `infer model run
--file` لإجراء فحص خام متعدد الوسائط بمطالبة مخصصة.

لجعل Ollama موفّر فهم الصور الافتراضي للوسائط الواردة:

```json5
{
  agents: {
    defaults: {
      imageModel: {
        primary: "ollama/qwen2.5vl:7b",
      },
    },
  },
}
```

فضّل مرجع `ollama/<model>` الكامل. لا يُطبَّع مرجع `imageModel` مجرد مثل
`qwen2.5vl:7b` إلى `ollama/qwen2.5vl:7b` إلا عندما يكون ذلك النموذج المطابق
مدرجًا ضمن `models.providers.ollama.models` مع
`input: ["text", "image"]`، ولا يعرض أي موفّر صور مهيّأ آخر
المعرّف المجرّد نفسه؛ وإلا فاستخدم بادئة الموفّر صراحةً.

قد تحتاج نماذج الرؤية المحلية البطيئة إلى مهلة أطول لفهم الصور مقارنةً
بالنماذج السحابية، وقد تتعطل على الأجهزة محدودة الموارد إذا حاول Ollama
تخصيص سياق الرؤية المُعلن كاملًا للنموذج. عيّن مهلة للإمكانية
وضع حدًا لـ `num_ctx`:

```json5
{
  models: {
    providers: {
      ollama: {
        models: [
          {
            id: "qwen2.5vl:7b",
            name: "qwen2.5vl:7b",
            input: ["text", "image"],
            params: { num_ctx: 2048, keep_alive: "1m" },
          },
        ],
      },
    },
  },
  tools: {
    media: {
      image: {
        timeoutSeconds: 180,
        models: [{ provider: "ollama", model: "qwen2.5vl:7b", timeoutSeconds: 300 }],
      },
    },
  },
}
```

تنطبق هذه المهلة على فهم الصور الواردة وعلى الأداة الصريحة
`image`. ويظل `models.providers.ollama.timeoutSeconds` يتحكم في
حارس طلب HTTP الأساسي الخاص بـ Ollama لاستدعاءات النماذج العادية.

التحقق المباشر:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

إذا عرّفت `models.providers.ollama.models` يدويًا، فضع علامة صريحة على نماذج
الرؤية:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

يرفض OpenClaw طلبات وصف الصور للنماذج التي لم تُعلَّم
بأنها تدعم الصور. ومع الاكتشاف الضمني، تأتي هذه المعلومة من إمكانية الرؤية
الخاصة بـ `/api/show`.

## التهيئة

<Tabs>
  <Tab title="أساسي (اكتشاف ضمني)">
    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    إذا كان `OLLAMA_API_KEY` معيّنًا، فيمكن حذف `apiKey` من إدخال الموفّر؛ يملؤه OpenClaw لإجراء فحوص التوفر.
    </Tip>

  </Tab>

  <Tab title="صريح (نماذج يدوية)">
    استخدم التهيئة الصريحة لإعداد سحابي مستضاف، أو مضيف/منفذ غير افتراضي، أو نوافذ
    سياق مفروضة، أو قوائم نماذج يدوية بالكامل:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 128000,
                maxTokens: 8192
              }
            ]
          }
        }
      }
    }
    ```

  </Tab>

  <Tab title="عنوان URL أساسي مخصص">
    تعطّل التهيئة الصريحة الاكتشاف التلقائي، لذا يجب إدراج النماذج:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // بلا /v1 - عنوان URL لواجهة API الأصلية لـ Ollama
            api: "ollama", // صريح: يضمن سلوك استدعاء الأدوات الأصلي
            timeoutSeconds: 300, // اختياري: ميزانية اتصال/بث أطول للنماذج المحلية الباردة
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // اختياري: إبقاء النموذج محمّلًا بين الدورات
                },
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    لا تضف `/v1`. يحدد ذلك المسار وضع التوافق مع OpenAI، حيث لا يكون استدعاء الأدوات موثوقًا.
    </Warning>

  </Tab>
</Tabs>

## وصفات شائعة

استبدل معرّفات النماذج بالأسماء المطابقة من `ollama list` أو
`openclaw models list --provider ollama`.

<AccordionGroup>
  <Accordion title="نموذج محلي مع الاكتشاف التلقائي">
    Ollama على الجهاز نفسه الذي يشغّل Gateway، ويُكتشف تلقائيًا:

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    لا تضف كتلة `models.providers.ollama` إلا إذا كنت تحتاج إلى نماذج يدوية.

  </Accordion>

  <Accordion title="مضيف Ollama على الشبكة المحلية مع نماذج يدوية">
    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 300,
            contextWindow: 32768,
            maxTokens: 8192,
            models: [
              {
                id: "qwen3.5:9b",
                name: "qwen3.5:9b",
                reasoning: true,
                input: ["text"],
                params: {
                  num_ctx: 32768,
                  thinking: false,
                  keep_alive: "15m",
                },
              },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: { primary: "ollama/qwen3.5:9b" },
        },
      },
    }
    ```

    تمثّل `contextWindow` ميزانية السياق في OpenClaw؛ وتُرسل `params.num_ctx` إلى
    Ollama. أبقهما متوافقين عندما يتعذر على الجهاز تشغيل سياق النموذج
    المُعلن كاملًا.

  </Accordion>

  <Accordion title="Ollama Cloud فقط">
    بلا برنامج خفي محلي، مع استخدام النماذج المستضافة مباشرةً:

    ```bash
    export OLLAMA_API_KEY="your-ollama-api-key"
    ```

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                contextWindow: 128000,
                maxTokens: 8192,
              },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: { primary: "ollama/kimi-k2.5:cloud" },
        },
      },
    }
    ```

    بالنسبة إلى معرّف المزوّد المخصص `ollama-cloud` بدلًا من هذه البنية، راجع
    [Ollama Cloud](/ar/providers/ollama-cloud).

  </Accordion>

  <Accordion title="السحابة مع التشغيل المحلي عبر برنامج خفي مسجَّل الدخول">
    ```bash
    ollama signin
    ollama pull gemma4
    ```

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://127.0.0.1:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 300,
            models: [
              { id: "gemma4", name: "gemma4", input: ["text"] },
              { id: "kimi-k2.5:cloud", name: "kimi-k2.5:cloud", input: ["text", "image"] },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "ollama/gemma4",
            fallbacks: ["ollama/kimi-k2.5:cloud"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="مضيفو Ollama متعددون">
    معرّفات مزوّد مخصصة عند تشغيل أكثر من خادم Ollama واحد؛ يحصل كل منها على
    مضيفه ونماذجه ومصادقته ومهلته الخاصة.

    ```json5
    {
      models: {
        providers: {
          "ollama-fast": {
            baseUrl: "http://mini.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            contextWindow: 32768,
            models: [{ id: "gemma4", name: "gemma4", input: ["text"] }],
          },
          "ollama-large": {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 420,
            contextWindow: 131072,
            maxTokens: 16384,
            models: [{ id: "qwen3.5:27b", name: "qwen3.5:27b", input: ["text"] }],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "ollama-fast/gemma4",
            fallbacks: ["ollama-large/qwen3.5:27b"],
          },
        },
      },
    }
    ```

    يزيل OpenClaw بادئة المزوّد النشط (مع الرجوع إلى بادئة
    `ollama/` مجردة) قبل استدعاء Ollama، لذا يصل `ollama-large/qwen3.5:27b`
    إلى Ollama بالصيغة `qwen3.5:27b`.

  </Accordion>

  <Accordion title="ملف تعريف مبسّط للنموذج المحلي">
    تتعامل بعض النماذج المحلية مع المطالبات البسيطة، لكنها تواجه صعوبة مع
    مجموعة أدوات الوكيل الكاملة. قيّد الأدوات والسياق قبل تعديل إعدادات
    وقت التشغيل العامة:

    ```json5
    {
      agents: {
        list: [
          {
            id: "local",
            experimental: {
              localModelLean: true,
            },
            model: { primary: "ollama/gemma4" },
          },
        ],
      },
      models: {
        providers: {
          ollama: {
            baseUrl: "http://127.0.0.1:11434",
            apiKey: "ollama-local",
            api: "ollama",
            contextWindow: 32768,
            models: [
              {
                id: "gemma4",
                name: "gemma4",
                input: ["text"],
                params: { num_ctx: 32768 },
                compat: { supportsTools: false },
              },
            ],
          },
        },
      },
    }
    ```

    استخدم `compat.supportsTools: false` فقط عندما يفشل النموذج أو الخادم باستمرار
    مع مخططات الأدوات — إذ يستبدل بعض قدرات الوكيل بالاستقرار.
    يزيل `localModelLean` أدوات المتصفح وCron والرسائل وإنشاء الوسائط
    والصوت وPDF الثقيلة من واجهة الوكيل المباشرة ما لم تكن مطلوبة صراحةً،
    ويضع الفهارس الأكبر خلف البحث عن الأدوات. ولا يغيّر سياق وقت تشغيل
    Ollama أو وضع التفكير. استخدمه مع `params.num_ctx` و
    `params.thinking: false` لنماذج التفكير الصغيرة الشبيهة بـ Qwen التي تدخل
    في حلقات أو تستنفد ميزانيتها في الاستدلال المخفي.

  </Accordion>
</AccordionGroup>

### اختيار النموذج

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

تعمل معرّفات المزوّد المخصصة بالطريقة نفسها: بالنسبة إلى مرجع يستخدم بادئة
المزوّد النشط، مثل `ollama-spark/qwen3:32b`، يزيل OpenClaw تلك البادئة قبل
استدعاء Ollama، ويرسل `qwen3:32b`.

بالنسبة إلى النماذج المحلية البطيئة، يُفضّل ضبط الإعدادات على مستوى المزوّد
قبل زيادة مهلة وقت تشغيل الوكيل بأكملها:

```json5
{
  models: {
    providers: {
      ollama: {
        timeoutSeconds: 300,
        models: [
          {
            id: "gemma4:26b",
            name: "gemma4:26b",
            params: { keep_alive: "15m" },
          },
        ],
      },
    },
  },
}
```

يغطي `timeoutSeconds` طلب HTTP الخاص بالنموذج: إعداد الاتصال والرؤوس
وتدفق النص والإلغاء الكامل المحمي للجلب. يُمرَّر `params.keep_alive`
بوصفه `keep_alive` من المستوى الأعلى في طلبات `/api/chat`
الأصلية؛ اضبطه لكل نموذج عندما يكون وقت التحميل في المحاولة الأولى هو عنق الزجاجة.

### تحقق سريع

```bash
# برنامج Ollama الخفي مرئي لهذا الجهاز
curl http://127.0.0.1:11434/api/tags

# فهرس OpenClaw والنموذج المحدد
openclaw models list --provider ollama
openclaw models status

# اختبار مباشر بسيط للنموذج
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "أجب بالنص التالي حرفيًا: ok"
```

بالنسبة إلى المضيفين البعيدين، استبدل `127.0.0.1` بمضيف
`baseUrl`. إذا كان `curl` يعمل بينما لا يعمل
OpenClaw، فتحقق مما إذا كان Gateway يعمل على جهاز أو حاوية أو حساب خدمة مختلف.

## بحث Ollama على الويب

يتضمن OpenClaw **بحث Ollama على الويب** بوصفه مزوّد `web_search`.

| الخاصية     | التفاصيل                                                                                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| المضيف      | `models.providers.ollama.baseUrl` عند تعيينه، وإلا `http://127.0.0.1:11434`؛ يستخدم `https://ollama.com` واجهة API المستضافة مباشرةً                          |
| المصادقة    | بلا مفتاح لمضيف محلي مسجَّل الدخول؛ أو `OLLAMA_API_KEY` أو مصادقة المزوّد المهيأة للبحث المباشر عبر `https://ollama.com` أو المضيفين المحميين بالمصادقة           |
| المتطلبات   | يجب أن تكون المضيفات المحلية/ذاتية الاستضافة قيد التشغيل ومسجَّلة الدخول باستخدام `ollama signin`؛ ويتطلب البحث المستضاف المباشر `baseUrl: "https://ollama.com"` إضافةً إلى مفتاح API حقيقي |

اختره أثناء `openclaw onboard` أو `openclaw configure --section web`، أو عيّن:

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

للبحث المستضاف المباشر عبر Ollama Cloud:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "https://ollama.com",
        apiKey: "OLLAMA_API_KEY",
        api: "ollama",
        models: [{ id: "kimi-k2.5:cloud", name: "kimi-k2.5:cloud", input: ["text"] }],
      },
    },
  },
  tools: {
    web: {
      search: { provider: "ollama" },
    },
  },
}
```

بالنسبة إلى مضيف ذاتي الاستضافة، يجرّب OpenClaw أولًا وكيل
`/api/experimental/web_search` المحلي، ثم يرجع إلى مسار `/api/web_search` المستضاف
على المضيف نفسه؛ ويستجيب البرنامج الخفي المحلي المسجَّل الدخول عادةً عبر
الوكيل المحلي. تستخدم استدعاءات `https://ollama.com` المباشرة دائمًا نقطة
نهاية `/api/web_search` المستضافة.

<Note>
للاطلاع على الإعداد والسلوك الكاملين، راجع [بحث Ollama على الويب](/ar/tools/ollama-search).
</Note>

## الإعدادات المتقدمة

<AccordionGroup>
  <Accordion title="الوضع القديم المتوافق مع OpenAI">
    <Warning>
    **استدعاء الأدوات غير موثوق في هذا الوضع.** استخدمه فقط عندما يحتاج وكيل إلى تنسيق OpenAI ولا تعتمد على استدعاء الأدوات الأصلي.
    </Warning>

    عيّن `api: "openai-completions"` صراحةً لوكيل خلف
    `/v1/chat/completions`:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // القيمة الافتراضية: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    قد لا يدعم هذا الوضع التدفق واستدعاء الأدوات بالتزامن؛ وقد تحتاج إلى
    `params: { streaming: false }` في النموذج.

    يحقن OpenClaw القيمة `options.num_ctx` افتراضيًا في هذا الوضع كي لا
    يرجع Ollama ضمنيًا إلى سياق من 4096 رمزًا. إذا كان الوكيل يرفض حقول
    `options` غير المعروفة، فعطّلها:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: false,
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="نوافذ السياق">
    بالنسبة إلى النماذج المكتشفة تلقائيًا، يستخدم OpenClaw نافذة السياق التي
    يبلغ عنها `/api/show`، بما في ذلك قيم `PARAMETER num_ctx` الأكبر
    من ملفات Modelfile المخصصة؛ وإلا فإنه يرجع إلى نافذة سياق Ollama
    الافتراضية في OpenClaw.

    تضبط `contextWindow` و`contextTokens` و`maxTokens` على
    مستوى المزوّد القيم الافتراضية لكل نموذج تابع لذلك المزوّد، ويمكن تجاوزها
    لكل نموذج. تمثل `contextWindow` ميزانية المطالبات/Compaction الخاصة
    بـ OpenClaw. تترك طلبات `/api/chat` الأصلية `options.num_ctx`
    دون تعيين ما لم تضبط `params.num_ctx` صراحةً، ولذلك يطبق Ollama
    القيمة الافتراضية الخاصة به استنادًا إلى النموذج أو `OLLAMA_CONTEXT_LENGTH`
    أو VRAM؛ ويجري تجاهل قيم `params.num_ctx` غير الصالحة أو الصفرية أو
    السالبة أو غير المحدودة. إذا كانت إعدادات أقدم تستخدم فقط
    `contextWindow`/`maxTokens` لفرض سياق الطلب الأصلي، فشغّل
    `openclaw doctor --fix` لنسخها إلى `params.num_ctx`. يواصل المحوّل المتوافق
    مع OpenAI حقن `options.num_ctx` افتراضيًا من `params.num_ctx` أو
    `contextWindow` المهيأ؛ عطّله باستخدام `injectNumCtxForOpenAICompat: false` إذا كان
    النظام الأعلى يرفض `options`.

    تقبل إدخالات النماذج الأصلية أيضًا خيارات وقت تشغيل Ollama الشائعة ضمن
    `params`، وتُمرَّر بوصفها `/api/chat` `options`
    أصلية: `num_keep` و`seed` و
    `num_predict` و`top_k` و`top_p` و
    `min_p` و`typical_p` و`repeat_last_n` و
    `temperature` و`repeat_penalty` و`presence_penalty` و
    `frequency_penalty` و`stop` و`num_batch` و
    `num_gpu` و`main_gpu` و`use_mmap` و
    `num_thread`. تُمرَّر بعض المفاتيح (`format` و
    `keep_alive` و`truncate` و`shift`) بوصفها
    حقول طلب من المستوى الأعلى بدلًا من تداخلها ضمن `options`.
    لا يمرر OpenClaw سوى مفاتيح طلب Ollama هذه، ولذلك لا تُرسل إلى Ollama
    مطلقًا معاملات وقت التشغيل فقط مثل `streaming`. استخدم
    `params.think` (أو `params.thinking`) لتعيين `think`
    من المستوى الأعلى؛ وتعطّل `false` التفكير على مستوى API
    لنماذج التفكير الشبيهة بـ Qwen.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            contextWindow: 32768,
            models: [
              {
                id: "llama3.3",
                contextWindow: 131072,
                maxTokens: 65536,
                params: {
                  num_ctx: 32768,
                  temperature: 0.7,
                  top_p: 0.9,
                  thinking: false,
                },
              }
            ]
          }
        }
      }
    }
    ```

    تعمل `agents.defaults.models["ollama/<model>"].params.num_ctx` لكل نموذج أيضًا؛ ويفوز إدخال نموذج المزوّد
    الصريح إذا جرى تعيين كليهما.

  </Accordion>

  <Accordion title="التحكم في التفكير">
    يمرر OpenClaw التفكير كما يتوقعه Ollama: `think` من المستوى
    الأعلى، وليس `options.think`. تعرض النماذج المكتشفة تلقائيًا التي
    يبلغ `/api/show` فيها عن قدرة `thinking` الخيارات
    `/think low` و`/think medium` و`/think high` و
    `/think max`؛ أما النماذج التي لا تدعم التفكير فلا تعرض سوى
    `/think off`.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    أو عيّن إعدادًا افتراضيًا للنموذج:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "ollama/gemma4": {
              thinking: "low",
            },
          },
        },
      },
    }
    ```

    يمكن لإعدادَي `params.think`/`params.thinking` الخاصَّين بكل نموذج تعطيل
    التفكير عبر API أو فرضه لنموذج محدد. يحافظ OpenClaw على هذا الإعداد الصريح
    عندما لا يتضمن التشغيل النشط سوى الإعداد الافتراضي الضمني `off`؛ ومع ذلك،
    يظل أمر وقت تشغيل غير معطّل مثل `/think medium` متجاوزًا له. لا يُرسل أبدًا
    طلب تفكير ذي قيمة صادقة إلى نموذج معلَّم صراحةً بالقيمة
    `reasoning: false`؛ بينما يُرسل طلب `think: false` دائمًا بصرف النظر عن ذلك.

  </Accordion>

  <Accordion title="نماذج الاستدلال">
    تُعامل النماذج المسماة `deepseek-r1` أو `reasoning` أو `reason` أو `think`
    افتراضيًا على أنها تدعم الاستدلال — ولا يلزم أي إعداد إضافي:

    ```bash
    ollama pull deepseek-r1:32b
    ```

  </Accordion>

  <Accordion title="تكاليف النماذج">
    يعمل Ollama محليًا ومجانًا، لذا تكون جميع تكاليف النماذج `0` لكل من
    النماذج المكتشفة تلقائيًا والمحددة يدويًا.
  </Accordion>

  <Accordion title="تضمينات الذاكرة">
    يسجّل Plugin ‏Ollama المضمّن موفّرًا لتضمينات الذاكرة من أجل
    [البحث في الذاكرة](/ar/concepts/memory). ويستخدم عنوان URL الأساسي لـ Ollama
    ومفتاح API المُعدَّين، ويستدعي `/api/embed`، ويجمع عدة مقاطع من الذاكرة
    في طلب `input` واحد متى أمكن.

    عند `proxy.enabled=true`، تستخدم طلبات التضمين إلى أصل الاسترجاع المحلي للمضيف
    المطابق تمامًا والمشتق من `baseUrl` المُعدّ مسار OpenClaw المباشر
    المحمي بدلًا من وكيل إعادة التوجيه المُدار. يجب أن يكون اسم المضيف المُعدّ
    نفسه `localhost` أو عنوان IP حرفيًا للاسترجاع؛ أما أسماء DNS التي لا
    تفعل سوى التحليل إلى الاسترجاع فتظل تستخدم مسار الوكيل المُدار. تظل مضيفات
    Ollama على LAN أو tailnet أو الشبكات الخاصة أو العامة دائمًا على مسار
    الوكيل المُدار، ولا ترث عمليات إعادة التوجيه إلى مضيف/منفذ آخر
    الثقة. يوجّه `proxy.loopbackMode: "proxy"` حركة مرور الاسترجاع عبر
    الوكيل على أي حال؛ بينما يرفضها `proxy.loopbackMode: "block"` قبل الاتصال —
    راجع [الوكيل المُدار](/ar/security/network-proxy#gateway-loopback-mode).

    | الخاصية | القيمة |
    | --- | --- |
    | النموذج الافتراضي | `nomic-embed-text` |
    | السحب التلقائي | نعم، إذا لم يكن موجودًا محليًا |
    | التزامن المضمّن الافتراضي | 1 (تستخدم الموفّرات الأخرى قيمة افتراضية أعلى؛ ارفعها باستخدام `nonBatchConcurrency` إذا كان المضيف قادرًا على تحمّلها) |

    تستخدم التضمينات وقت الاستعلام بادئات الاسترجاع للنماذج التي تتطلبها أو
    توصي بها: `nomic-embed-text` و`qwen3-embedding` و
    `mxbai-embed-large`. تظل دُفعات المستندات خامًا، لذا لا تحتاج الفهارس الحالية
    إلى ترحيل التنسيق.

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            remote: {
              // القيمة الافتراضية لـ Ollama. ارفعها على المضيفات الأكبر إذا كانت إعادة الفهرسة بطيئة جدًا.
              nonBatchConcurrency: 1,
            },
          },
        },
      },
    }
    ```

    بالنسبة إلى مضيف تضمين بعيد، أبقِ المصادقة محصورة بذلك المضيف:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            model: "nomic-embed-text",
            remote: {
              baseUrl: "http://gpu-box.local:11434",
              apiKey: "ollama-local",
              nonBatchConcurrency: 2,
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="إعداد البث">
    يستخدم Ollama **واجهة API الأصلية** (`/api/chat`) افتراضيًا، وهي تدعم
    البث واستدعاء الأدوات معًا — ولا يلزم أي إعداد خاص.

    في الطلبات الأصلية، يُمرَّر التحكم في التفكير مباشرةً: يرسل `/think off`
    و`openclaw agent --thinking off` قيمة `think: false` على المستوى الأعلى ما لم
    يُعدَّ `params.think`/`params.thinking` صراحةً؛ ويرسل `/think
    low|medium|high` سلسلة مستوى الجهد المطابقة؛
    ويُطابق `/think max` أعلى مستوى جهد في Ollama، وهو `think: "high"`.

    <Tip>
    لاستخدام نقطة النهاية المتوافقة مع OpenAI بدلًا من ذلك، راجع «الوضع القديم المتوافق مع OpenAI» أعلاه — فقد لا يعمل البث واستدعاء الأدوات معًا هناك.
    </Tip>

  </Accordion>
</AccordionGroup>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="حلقة تعطل WSL2 (عمليات إعادة تشغيل متكررة)">
    في WSL2 مع NVIDIA/CUDA، ينشئ مثبّت Ollama الرسمي لنظام Linux
    وحدة systemd باسم `ollama.service` تحتوي على `Restart=always`. إذا بدأت تلك الخدمة
    تلقائيًا وحمّلت نموذجًا مدعومًا بوحدة معالجة الرسومات أثناء إقلاع WSL2، فقد يثبّت
    Ollama ذاكرة المضيف أثناء التحميل؛ ولا تستطيع آلية استرداد الذاكرة في Hyper-V
    دائمًا استرداد تلك الصفحات، ولذلك قد ينهي Windows جهاز WSL2 الافتراضي، ثم يعيد
    systemd تشغيل Ollama، وتتكرر الحلقة.

    الدليل: عمليات إعادة تشغيل/إنهاء متكررة لـ WSL2، واستخدام مرتفع لوحدة المعالجة
    المركزية في `app.slice` أو `ollama.service` مباشرةً بعد بدء WSL2،
    وإشارة SIGTERM من systemd بدلًا من قاتل نفاد الذاكرة في Linux.

    يسجّل OpenClaw تحذيرًا عند بدء التشغيل عندما يكتشف WSL2 مع تمكين
    `ollama.service` باستخدام `Restart=always`، ووجود علامات CUDA مرئية.

    التخفيف:

    ```bash
    sudo systemctl disable ollama
    ```

    على جانب Windows، أضف ما يلي إلى `%USERPROFILE%\.wslconfig`، ثم شغّل
    `wsl --shutdown`:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    أو قصّر مدة إبقاء النموذج نشطًا / شغّل Ollama يدويًا عند الحاجة فقط:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    راجع [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317).

  </Accordion>

  <Accordion title="لم يُكتشف Ollama">
    تأكد من أن Ollama قيد التشغيل، وأن `OLLAMA_API_KEY` (أو ملف تعريف مصادقة)
    مضبوط، وأن `models.providers.ollama` **غير** معرّف صراحةً:

    ```bash
    ollama serve
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="لا تتوفر نماذج">
    اسحب النموذج محليًا، أو عرّفه صراحةً في
    `models.providers.ollama`:

    ```bash
    ollama list  # اعرض النماذج المثبتة
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # أو نموذجًا آخر
    ```

  </Accordion>

  <Accordion title="رُفض الاتصال">
    ```bash
    # تحقق مما إذا كان Ollama قيد التشغيل
    ps aux | grep ollama

    # أو أعد تشغيل Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="يعمل المضيف البعيد مع curl ولكن ليس مع OpenClaw">
    تحقّق من الجهاز نفسه وبيئة وقت التشغيل نفسها اللذين يشغّلان Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    الأسباب الشائعة:

    - `baseUrl` يشير إلى `localhost`، لكن Gateway يعمل في Docker أو على مضيف آخر.
    - يستخدم عنوان URL ‏`/v1`، مما يحدد السلوك المتوافق مع OpenAI بدلًا من Ollama الأصلي.
    - يحتاج المضيف البعيد إلى تغييرات في جدار الحماية أو الربط بشبكة LAN.
    - النموذج موجود في الخدمة الخفية على حاسوبك المحمول، لكنه غير موجود في الخدمة البعيدة.

  </Accordion>

  <Accordion title="يُخرج النموذج JSON الخاص بالأدوات كنص">
    يكون الموفّر عادةً في الوضع المتوافق مع OpenAI، أو لا يستطيع النموذج
    معالجة مخططات الأدوات. فضّل الوضع الأصلي:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434",
            api: "ollama",
          },
        },
      },
    }
    ```

    إذا ظل نموذج محلي صغير يفشل مع مخططات الأدوات، فاضبط
    `compat.supportsTools: false` في إدخال ذلك النموذج وأعد الاختبار.

  </Accordion>

  <Accordion title="يعيد Kimi أو GLM رموزًا مشوشة">
    تُعامل استجابات Kimi/GLM المستضافة التي تتكون من سلاسل طويلة من الرموز
    غير اللغوية على أنها استدعاء فاشل للموفّر بدلًا من رد ناجح، بحيث تتولى
    آليات إعادة المحاولة/الاحتياط/معالجة الأخطاء المعتادة المهمة بدلًا من
    حفظ النص التالف في الجلسة.

    إذا تكرر ذلك، فالتقط اسم النموذج وملف الجلسة الحالي وما إذا كان التشغيل
    قد استخدم `Cloud + Local` أو `Cloud only`، ثم جرّب جلسة جديدة
    ونموذجًا احتياطيًا:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "أجب بالنص التالي فقط: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="تنتهي مهلة النموذج المحلي البارد">
    قد تحتاج النماذج المحلية الكبيرة إلى وقت طويل عند التحميل الأول. احصر
    المهلة في موفّر Ollama، ويمكنك اختياريًا إبقاء النموذج محمّلًا بين الأدوار:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            timeoutSeconds: 300,
            models: [
              {
                id: "gemma4:26b",
                name: "gemma4:26b",
                params: { keep_alive: "15m" },
              },
            ],
          },
        },
      },
    }
    ```

    إذا كان المضيف نفسه بطيئًا في قبول الاتصالات، فإن `timeoutSeconds`
    يمدد أيضًا مهلة الاتصال المحمية لهذا الموفّر.

  </Accordion>

  <Accordion title="النموذج ذو السياق الكبير بطيء جدًا أو تنفد ذاكرته">
    تعلن نماذج كثيرة عن سياقات أكبر مما تستطيع أجهزتك تشغيله براحة.
    يستخدم Ollama الأصلي إعداد وقت التشغيل الافتراضي الخاص به ما لم
    يُضبط `params.num_ctx`. حدّد سقفًا لكل من ميزانية OpenClaw وسياق طلب
    Ollama للحصول على زمن وصول متوقع لأول رمز:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            contextWindow: 32768,
            maxTokens: 8192,
            models: [
              {
                id: "qwen3.5:9b",
                name: "qwen3.5:9b",
                params: { num_ctx: 32768, thinking: false },
              },
            ],
          },
        },
      },
    }
    ```

    خفّض `contextWindow` إذا كان OpenClaw يرسل مطالبة أطول من اللازم.
    خفّض `params.num_ctx` إذا كان سياق وقت تشغيل Ollama أكبر من قدرة الجهاز.
    خفّض `maxTokens` إذا استغرق التوليد وقتًا طويلًا جدًا.

  </Accordion>
</AccordionGroup>

<Note>
لمزيد من المساعدة: [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) و[الأسئلة الشائعة](/ar/help/faq).
</Note>

## ذو صلة

<CardGroup cols={2}>
  <Card title="Ollama Cloud" href="/ar/providers/ollama-cloud" icon="cloud">
    إعداد سحابي فقط باستخدام الموفّر المخصص `ollama-cloud`.
  </Card>
  <Card title="موفّرو النماذج" href="/ar/concepts/model-providers" icon="layers">
    نظرة عامة على جميع الموفّرين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="اختيار النموذج" href="/ar/concepts/models" icon="brain">
    كيفية اختيار النماذج وإعدادها.
  </Card>
  <Card title="بحث Ollama على الويب" href="/ar/tools/ollama-search" icon="magnifying-glass">
    تفاصيل الإعداد والسلوك الكاملة للبحث على الويب المدعوم من Ollama.
  </Card>
  <Card title="الإعداد" href="/ar/gateway/configuration" icon="gear">
    مرجع الإعداد الكامل.
  </Card>
</CardGroup>
