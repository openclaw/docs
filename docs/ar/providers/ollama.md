---
read_when:
    - تريد تشغيل OpenClaw باستخدام نماذج سحابية أو محلية عبر Ollama
    - تحتاج إلى إرشادات لإعداد Ollama وتكوينه
    - تريد نماذج الرؤية من Ollama لفهم الصور
summary: شغّل OpenClaw باستخدام Ollama (النماذج السحابية والمحلية)
title: Ollama
x-i18n:
    generated_at: "2026-07-03T09:39:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9d91871ef96c3bdc027fe7cfceecae7e1d050913d859e3c6840725002fdf57af
    source_path: providers/ollama.md
    workflow: 16
---

يتكامل OpenClaw مع واجهة Ollama الأصلية (`/api/chat`) للنماذج السحابية المستضافة وخوادم Ollama المحلية/ذاتية الاستضافة. يمكنك استخدام Ollama بثلاثة أوضاع: `Cloud + Local` عبر مضيف Ollama قابل للوصول، أو `Cloud only` مقابل `https://ollama.com`، أو `Local only` مقابل مضيف Ollama قابل للوصول.

يسجل OpenClaw أيضًا `ollama-cloud` كمعرّف موفر مستضاف من الدرجة الأولى
لاستخدام Ollama Cloud مباشرة. استخدم مراجع مثل `ollama-cloud/kimi-k2.5:cloud` عندما
تريد توجيهًا سحابيًا فقط من دون مشاركة معرّف الموفر المحلي `ollama`.

لصفحة إعداد السحابة فقط المخصصة، راجع [Ollama Cloud](/ar/providers/ollama-cloud).

<Warning>
**مستخدمو Ollama البعيدون**: لا تستخدم عنوان URL المتوافق مع OpenAI بصيغة `/v1` (`http://host:11434/v1`) مع OpenClaw. يؤدي هذا إلى تعطيل استدعاء الأدوات وقد تُخرج النماذج JSON الأدوات الخام كنص عادي. استخدم عنوان URL لواجهة Ollama الأصلية بدلًا من ذلك: `baseUrl: "http://host:11434"` (بدون `/v1`).
</Warning>

يستخدم إعداد موفر Ollama المفتاح `baseUrl` كمفتاح قياسي. يقبل OpenClaw أيضًا `baseURL` للتوافق مع أمثلة نمط OpenAI SDK، لكن يجب أن تفضّل الإعدادات الجديدة `baseUrl`.

## قواعد المصادقة

<AccordionGroup>
  <Accordion title="Local and LAN hosts">
    لا تحتاج مضيفات Ollama المحلية ومضيفات LAN إلى رمز حامل حقيقي. يستخدم OpenClaw علامة `ollama-local` المحلية فقط لعناوين URL الأساسية الخاصة بـ Ollama التي تكون local loopback، أو شبكة خاصة، أو `.local`، أو اسم مضيف مجرد.
  </Accordion>
  <Accordion title="Remote and Ollama Cloud hosts">
    تتطلب المضيفات العامة البعيدة وOllama Cloud (`https://ollama.com`) بيانات اعتماد حقيقية عبر `OLLAMA_API_KEY`، أو ملف تعريف مصادقة، أو `apiKey` الخاص بالموفر. للاستخدام المستضاف المباشر، فضّل الموفر `ollama-cloud`.
  </Accordion>
  <Accordion title="Custom provider ids">
    تتبع معرّفات الموفر المخصصة التي تضبط `api: "ollama"` القواعد نفسها. على سبيل المثال، يمكن لموفر `ollama-remote` يشير إلى مضيف Ollama خاص على LAN أن يستخدم `apiKey: "ollama-local"` وستحل الوكلاء الفرعيون تلك العلامة عبر خطاف موفر Ollama بدلًا من التعامل معها كبيانات اعتماد مفقودة. يمكن لبحث الذاكرة أيضًا ضبط `agents.defaults.memorySearch.provider` على معرّف الموفر المخصص ذاك بحيث تستخدم التضمينات نقطة نهاية Ollama المطابقة.
  </Accordion>
  <Accordion title="Auth profiles">
    يخزن `auth-profiles.json` بيانات الاعتماد لمعرّف موفر. ضع إعدادات نقطة النهاية (`baseUrl`، و`api`، ومعرّفات النماذج، والرؤوس، والمهلات) في `models.providers.<id>`. ملفات ملف تعريف المصادقة المسطحة الأقدم مثل `{ "ollama-windows": { "apiKey": "ollama-local" } }` ليست تنسيق تشغيل؛ شغّل `openclaw doctor --fix` لإعادة كتابتها إلى ملف تعريف مفتاح API القياسي `ollama-windows:default` مع نسخة احتياطية. وجود `baseUrl` في ذلك الملف ضجيج توافق ويجب نقله إلى إعداد الموفر.
  </Accordion>
  <Accordion title="Memory embedding scope">
    عند استخدام Ollama لتضمينات الذاكرة، تُحدد مصادقة الحامل بنطاق المضيف الذي صُرّح بها فيه:

    - يُرسل المفتاح على مستوى الموفر فقط إلى مضيف Ollama الخاص بذلك الموفر.
    - يُرسل `agents.*.memorySearch.remote.apiKey` فقط إلى مضيف التضمين البعيد الخاص به.
    - تُعامل قيمة البيئة `OLLAMA_API_KEY` الصرفة كاصطلاح Ollama Cloud، ولا تُرسل إلى المضيفات المحلية أو ذاتية الاستضافة افتراضيًا.

  </Accordion>
</AccordionGroup>

## بدء الاستخدام

اختر طريقة الإعداد والوضع المفضلين لديك.

<Tabs>
  <Tab title="Onboarding (recommended)">
    **الأفضل لـ:** أسرع مسار إلى إعداد Ollama سحابي أو محلي عامل.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        ```

        اختر **Ollama** من قائمة الموفرين.
      </Step>
      <Step title="Choose your mode">
        - **Cloud + Local** — مضيف Ollama محلي بالإضافة إلى نماذج سحابية تُوجه عبر ذلك المضيف
        - **Cloud only** — نماذج Ollama مستضافة عبر `https://ollama.com`
        - **Local only** — نماذج محلية فقط

      </Step>
      <Step title="Select a model">
        يطلب `Cloud only` قيمة `OLLAMA_API_KEY` ويقترح افتراضيات سحابية مستضافة. يطلب `Cloud + Local` و`Local only` عنوان URL أساسيًا لـ Ollama، ويكتشفان النماذج المتاحة، ويسحبان النموذج المحلي المحدد تلقائيًا إذا لم يكن متاحًا بعد. عندما يبلغ Ollama عن وسم `:latest` مثبت مثل `gemma4:latest`، يعرض الإعداد ذلك النموذج المثبت مرة واحدة بدلًا من عرض كل من `gemma4` و`gemma4:latest` أو سحب الاسم المستعار المجرد مرة أخرى. يتحقق `Cloud + Local` أيضًا مما إذا كان مضيف Ollama هذا مسجل الدخول للوصول السحابي.
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    ### الوضع غير التفاعلي

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --accept-risk
    ```

    اختياريًا، حدد عنوان URL أساسيًا مخصصًا أو نموذجًا:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Manual setup">
    **الأفضل لـ:** تحكم كامل في الإعداد السحابي أو المحلي.

    <Steps>
      <Step title="Choose cloud or local">
        - **Cloud + Local**: ثبّت Ollama، وسجّل الدخول باستخدام `ollama signin`، ووجه الطلبات السحابية عبر ذلك المضيف
        - **Cloud only**: استخدم `https://ollama.com` مع `OLLAMA_API_KEY`
        - **Local only**: ثبّت Ollama من [ollama.com/download](https://ollama.com/download)

      </Step>
      <Step title="Pull a local model (local only)">
        ```bash
        ollama pull gemma4
        # or
        ollama pull gpt-oss:20b
        # or
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Enable Ollama for OpenClaw">
        بالنسبة إلى `Cloud only`، استخدم قيمة `OLLAMA_API_KEY` الحقيقية الخاصة بك. بالنسبة إلى الإعدادات المدعومة بمضيف، تعمل أي قيمة بديلة:

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # Or configure in your config file
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="Inspect and set your model">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        أو اضبط الافتراضي في الإعداد:

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

## النماذج السحابية

<Tabs>
  <Tab title="Cloud + Local">
    يستخدم `Cloud + Local` مضيف Ollama قابلًا للوصول كنقطة تحكم لكل من النماذج المحلية والسحابية. هذا هو تدفق Ollama الهجين المفضل.

    استخدم **Cloud + Local** أثناء الإعداد. يطلب OpenClaw عنوان URL الأساسي لـ Ollama، ويكتشف النماذج المحلية من ذلك المضيف، ويتحقق مما إذا كان المضيف مسجل الدخول للوصول السحابي باستخدام `ollama signin`. عندما يكون المضيف مسجل الدخول، يقترح OpenClaw أيضًا افتراضيات سحابية مستضافة مثل `kimi-k2.5:cloud` و`minimax-m2.7:cloud` و`glm-5.1:cloud`.

    إذا لم يكن المضيف مسجل الدخول بعد، يُبقي OpenClaw الإعداد محليًا فقط إلى أن تشغّل `ollama signin`.

  </Tab>

  <Tab title="Cloud only">
    يعمل `Cloud only` مقابل واجهة API المستضافة الخاصة بـ Ollama على `https://ollama.com`.

    استخدم **Cloud only** أثناء الإعداد. يطلب OpenClaw قيمة `OLLAMA_API_KEY`، ويضبط `baseUrl: "https://ollama.com"`، ويمهد قائمة النماذج السحابية المستضافة. لا يتطلب هذا المسار خادم Ollama محليًا أو `ollama signin`.

    تُملأ قائمة النماذج السحابية المعروضة أثناء `openclaw onboard` مباشرة من `https://ollama.com/api/tags`، بحد أقصى 500 إدخال، بحيث يعكس المنتقي الكتالوج المستضاف الحالي بدلًا من تمهيد ثابت. إذا تعذر الوصول إلى `ollama.com` أو لم يُرجع أي نماذج وقت الإعداد، يعود OpenClaw إلى الاقتراحات السابقة المشفرة ثابتًا حتى يظل الإعداد الأولي مكتملًا.

    يمكنك أيضًا إعداد موفر السحابة من الدرجة الأولى مباشرة:

    ```bash
    openclaw onboard --auth-choice ollama-cloud
    openclaw models set ollama-cloud/kimi-k2.5:cloud
    ```

  </Tab>

  <Tab title="Local only">
    في وضع المحلي فقط، يكتشف OpenClaw النماذج من مثيل Ollama المُعد. هذا المسار مخصص لخوادم Ollama المحلية أو ذاتية الاستضافة.

    يقترح OpenClaw حاليًا `gemma4` كافتراضي محلي.

  </Tab>
</Tabs>

## اكتشاف النماذج (الموفر الضمني)

عندما تضبط `OLLAMA_API_KEY` (أو ملف تعريف مصادقة) و**لا** تعرّف `models.providers.ollama` أو موفرًا بعيدًا مخصصًا آخر مع `api: "ollama"`، يكتشف OpenClaw النماذج من مثيل Ollama المحلي عند `http://127.0.0.1:11434`.

| السلوك              | التفاصيل                                                                                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| استعلام الكتالوج        | يستعلم `/api/tags`                                                                                                                                                  |
| اكتشاف القدرات | يستخدم عمليات بحث `/api/show` بأفضل جهد لقراءة `contextWindow`، ومعلمات Modelfile الموسعة `num_ctx`، والقدرات بما في ذلك الرؤية/الأدوات                       |
| نماذج الرؤية        | تُعلّم النماذج التي تبلغ `/api/show` عن قدرة `vision` بأنها قادرة على الصور (`input: ["text", "image"]`)، لذلك يحقن OpenClaw الصور تلقائيًا في الموجّه  |
| اكتشاف الاستدلال  | يستخدم قدرات `/api/show` عند توفرها، بما في ذلك `thinking`؛ ويعود إلى حدس قائم على اسم النموذج (`r1`، و`reasoning`، و`think`) عندما يحذف Ollama القدرات |
| حدود الرموز         | يضبط `maxTokens` على حد الرموز الأقصى الافتراضي في Ollama الذي يستخدمه OpenClaw                                                                                                |
| التكاليف                | يضبط كل التكاليف على `0`                                                                                                                                                |

يتجنب هذا إدخالات النماذج اليدوية مع إبقاء الكتالوج متوافقًا مع مثيل Ollama المحلي. يمكنك استخدام مرجع كامل مثل `ollama/<pulled-model>:latest` في `infer model run` المحلي؛ يحل OpenClaw ذلك النموذج المثبت من كتالوج Ollama المباشر من دون الحاجة إلى إدخال `models.json` مكتوب يدويًا.

بالنسبة إلى مضيفات Ollama المسجلة الدخول، قد تكون بعض نماذج `:cloud` قابلة للاستخدام عبر `/api/chat`
و`/api/show` قبل ظهورها في `/api/tags`. عندما تختار صراحة
مرجع `ollama/<model>:cloud` كاملًا، يتحقق OpenClaw من ذلك النموذج المفقود الدقيق باستخدام
`/api/show` ويضيفه إلى كتالوج التشغيل فقط إذا أكد Ollama
بيانات النموذج الوصفية. لا تزال الأخطاء المطبعية تفشل كنماذج غير معروفة بدلًا من إنشائها تلقائيًا.

```bash
# See what models are available
ollama list
openclaw models list
```

لاختبار دخان ضيق لتوليد النصوص يتجنب سطح أدوات الوكيل الكامل،
استخدم `infer model run` المحلي مع مرجع نموذج Ollama كامل:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

لا يزال ذلك المسار يستخدم الموفر والمصادقة ونقل Ollama الأصلي
المُعدّة في OpenClaw، لكنه لا يبدأ دورة وكيل محادثة ولا يحمّل سياق MCP/الأدوات. إذا
نجح هذا بينما تفشل ردود الوكيل العادية، فاستكشف بعد ذلك قدرة موجّه/أدوات
الوكيل الخاصة بالنموذج.

لاختبار دخان ضيق لنموذج رؤية على المسار الخفيف نفسه، أضف ملف صورة واحدًا أو أكثر
إلى `infer model run`. يرسل هذا الموجّه والصورة مباشرة إلى
نموذج رؤية Ollama المحدد دون تحميل أدوات المحادثة أو الذاكرة أو سياق
جلسة سابق:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

`model run --file` يقبل الملفات المكتشفة كـ `image/*`، بما في ذلك مدخلات PNG وJPEG وWebP الشائعة. تُرفض الملفات غير الصورية قبل استدعاء Ollama. للتعرّف على الكلام، استخدم `openclaw infer audio transcribe` بدلا من ذلك.

عند تبديل محادثة باستخدام `/model ollama/<model>`، يتعامل OpenClaw مع ذلك كاختيار مستخدم دقيق. إذا كان `baseUrl` الخاص بـ Ollama المكوّن غير قابل للوصول، فسيفشل الرد التالي بخطأ المزوّد بدلا من الإجابة بصمت من نموذج احتياطي آخر مكوّن.

تنفّذ مهام Cron المعزولة فحص أمان محليا إضافيا واحدا قبل بدء دور الوكيل. إذا كان النموذج المحدد يُحل إلى مزوّد Ollama محلي أو على شبكة خاصة أو `.local` وكان `/api/tags` غير قابل للوصول، يسجّل OpenClaw تشغيل Cron هذا على أنه `skipped` مع `ollama/<model>` المحدد في نص الخطأ. يُخزّن فحص نقطة النهاية المسبق مؤقتا لمدة 5 دقائق، لذلك لا تطلق مهام Cron المتعددة الموجّهة إلى نفس خادم Ollama المتوقف طلبات نموذج فاشلة كلها.

تحقق مباشرة من مسار النص المحلي، ومسار البث الأصلي، والتضمينات مقابل Ollama المحلي باستخدام:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

لاختبارات الدخان الخاصة بمفاتيح API في Ollama Cloud، وجّه الاختبار المباشر إلى `https://ollama.com` واختر نموذجا مستضافا من الفهرس الحالي:

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

يشغّل اختبار الدخان السحابي النص، والبث الأصلي، والبحث على الويب. ويتخطى التضمينات افتراضيا لـ `https://ollama.com` لأن مفاتيح API في Ollama Cloud قد لا تخوّل استخدام `/api/embed`. عيّن `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` عندما تريد صراحة أن يفشل الاختبار المباشر إذا لم يستطع المفتاح السحابي المكوّن استخدام نقطة نهاية التضمين.

لإضافة نموذج جديد، اسحبه ببساطة باستخدام Ollama:

```bash
ollama pull mistral
```

سيُكتشف النموذج الجديد تلقائيا ويصبح متاحا للاستخدام.

<Note>
إذا عيّنت `models.providers.ollama` صراحة، أو كوّنت مزوّدا بعيدا مخصصا مثل `models.providers.ollama-cloud` مع `api: "ollama"`، فسيتم تخطي الاكتشاف التلقائي ويجب عليك تعريف النماذج يدويا. لا يزال مزوّدو local loopback المخصصون مثل `http://127.0.0.2:11434` يُعاملون كمحليين. راجع قسم التكوين الصريح أدناه.
</Note>

## الاستدلال المحلي على Node

يمكن للوكلاء تفويض مهمة قصيرة إلى نموذج Ollama مثبت على Node سطح مكتب أو خادم مقترن. يعبر الطلب والاستجابة اتصال Gateway/Node المصادق الحالي؛ ويعمل طلب النموذج على Node المحدد مقابل نقطة نهاية Ollama القياسية عبر loopback (`http://127.0.0.1:11434`).

<Steps>
  <Step title="Start Ollama on the node">
    اسحب نموذجا واحدا على الأقل للدردشة وأبق Ollama قيد التشغيل:

    ```bash
    ollama pull qwen3:0.6b
    ollama list
    ```

  </Step>
  <Step title="Connect the node host">
    على الجهاز نفسه الذي يعمل عليه Ollama، صِل مضيف Node بـ Gateway:

    ```bash
    openclaw node run \
      --host <gateway-host> \
      --port 18789 \
      --display-name "Local inference"
    ```

    وافق على الجهاز الجديد وأوامر Node المعلنة الخاصة به على مضيف Gateway، ثم تحقق من Node:

    ```bash
    openclaw devices list
    openclaw devices approve <deviceRequestId>
    openclaw nodes pending
    openclaw nodes approve <nodeRequestId>
    openclaw nodes status --connected
    ```

    يمكن لكل من الاتصال الأول والترقية التي تضيف أوامر Ollama أن يفعّلا الموافقة على أوامر Node. إذا اتصلت Node دون الإعلان عن `ollama.models` و`ollama.chat`، فتحقق من `openclaw nodes pending` مرة أخرى.

  </Step>
  <Step title="Ask an agent to use local inference">
    يعرّض Plugin Ollama المضمن أداة `node_inference`. يستخدم الوكلاء أولا `action: "discover"`، ثم `action: "run"` مع Node ونموذج مُرجعين. إذا كانت هناك Node واحدة قادرة متصلة بالضبط، يمكن لـ `run` حذف Node.

    على سبيل المثال: "اكتشف نماذج Ollama على عقدي، ثم استخدم أسرع نموذج محمّل لتلخيص هذا النص."

  </Step>
</Steps>

يقرأ الاكتشاف `/api/tags`، ويفحص إمكانات `/api/show`، ويستخدم `/api/ps` عند توفره لترتيب النماذج المحمّلة مسبقا أولا. ولا يُرجع إلا نماذج دردشة محلية قادرة: تُستبعد صفوف Ollama Cloud والنماذج المخصصة للتضمين فقط. يطلب كل تشغيل من Ollama تعطيل تفكير النموذج ويحد الإخراج عند 512 رمزا ما لم يطلب استدعاء الأداة قيمة `maxTokens` مختلفة. بعض النماذج، مثل GPT-OSS، لا تدعم تعطيل التفكير وقد تظل تستخدم رموز الاستدلال.

لإبقاء Ollama قيد التشغيل على Node دون إتاحته للوكلاء، عيّن ما يلي في التكوين المستخدم بواسطة مضيف Node ذلك:

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

إذا كانت Node تستخدم أمر `openclaw node run` في الواجهة الأمامية من الإعداد أعلاه، فأوقف تلك العملية وشغّل الأمر مرة أخرى. إذا كانت تستخدم خدمة Node مثبتة، فشغّل `openclaw node restart`.

تتوقف Node عن الإعلان عن `ollama.models` و`ollama.chat`؛ بينما يظل Ollama نفسه ومزوّد Ollama في Gateway دون تغيير. عيّن القيمة إلى `true` وأعد تشغيل Node للإعلان عن الاستدلال المحلي مرة أخرى. قد يتطلب سطح الأوامر المتغير موافقة عبر `openclaw nodes pending` بعد إعادة الاتصال.

يمكنك التحقق من أوامر Node نفسها دون دور وكيل:

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

لا يعيد الاستدلال المحلي على Node عمدا استخدام `models.providers.ollama.baseUrl` بعيد أو سحابي. شغّل Ollama على نقطة نهاية loopback القياسية الخاصة بـ Node. تكون أوامر Node متاحة افتراضيا على مضيفات Node في macOS وLinux وWindows وتظل خاضعة لسياسة الاقتران والأوامر العادية الخاصة بـ Node.

## الرؤية ووصف الصور

يسجّل Plugin Ollama المضمن Ollama كمزوّد فهم وسائط قادر على الصور. يتيح ذلك لـ OpenClaw توجيه طلبات وصف الصور الصريحة وافتراضيات نماذج الصور المكوّنة عبر نماذج رؤية Ollama المحلية أو المستضافة.

للرؤية المحلية، اسحب نموذجا يدعم الصور:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

ثم تحقق باستخدام CLI الاستدلال:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

يجب أن يكون `--model` مرجعا كاملا بصيغة `<provider/model>`. عند تعيينه، يحاول `openclaw infer image describe` ذلك النموذج أولا بدلا من تخطي الوصف لأن النموذج يدعم الرؤية الأصلية. إذا فشل استدعاء النموذج، يمكن لـ OpenClaw المتابعة عبر `agents.defaults.imageModel.fallbacks` المكوّنة؛ أما أخطاء إعداد الملف أو URL فتظل تفشل قبل محاولات الاحتياط.

استخدم `infer image describe` عندما تريد مسار مزوّد فهم الصور في OpenClaw، و`agents.defaults.imageModel` المكوّن، وشكل إخراج وصف الصور. استخدم `infer model run --file` عندما تريد فحص نموذج متعدد الوسائط خاما بمطالبة مخصصة وصورة واحدة أو أكثر.

لجعل Ollama نموذج فهم الصور الافتراضي للوسائط الواردة، كوّن `agents.defaults.imageModel`:

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

فضّل المرجع الكامل `ollama/<model>`. إذا كان النموذج نفسه مدرجا ضمن `models.providers.ollama.models` مع `input: ["text", "image"]` ولا يعرّض أي مزوّد صور مكوّن آخر معرف النموذج المجرد نفسه، فإن OpenClaw يطبّع أيضا مرجع `imageModel` مجردا مثل `qwen2.5vl:7b` إلى `ollama/qwen2.5vl:7b`. إذا كان لدى أكثر من مزوّد صور مكوّن المعرف المجرد نفسه، فاستخدم بادئة المزوّد صراحة.

قد تحتاج نماذج الرؤية المحلية البطيئة إلى مهلة أطول لفهم الصور من النماذج السحابية. وقد تتعطل أو تتوقف أيضا عندما يحاول Ollama تخصيص سياق الرؤية المعلن كاملا على عتاد محدود. عيّن مهلة للإمكانات، وحدد `num_ctx` في إدخال النموذج عندما تحتاج فقط إلى دور وصف صورة عادي:

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

تنطبق هذه المهلة على فهم الصور الواردة وعلى أداة `image` الصريحة التي يمكن للوكيل استدعاؤها أثناء دور. لا يزال `models.providers.ollama.timeoutSeconds` على مستوى المزوّد يتحكم في حارس طلب HTTP الأساسي الخاص بـ Ollama لاستدعاءات النماذج العادية.

تحقق مباشرة من أداة الصور الصريحة مقابل Ollama المحلي باستخدام:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

إذا عرّفت `models.providers.ollama.models` يدويا، فعلّم نماذج الرؤية بدعم إدخال الصور:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

يرفض OpenClaw طلبات وصف الصور للنماذج غير المعلمة بأنها قادرة على الصور. مع الاكتشاف الضمني، يقرأ OpenClaw هذا من Ollama عندما يبلّغ `/api/show` عن قدرة رؤية.

## التكوين

<Tabs>
  <Tab title="Basic (implicit discovery)">
    أبسط مسار تمكين محلي فقط يكون عبر متغير بيئة:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    إذا كان `OLLAMA_API_KEY` معيّنا، يمكنك حذف `apiKey` في إدخال المزوّد وسيملؤه OpenClaw لفحوص التوفر.
    </Tip>

  </Tab>

  <Tab title="Explicit (manual models)">
    استخدم التكوين الصريح عندما تريد إعدادا سحابيا مستضافا، أو يعمل Ollama على مضيف/منفذ آخر، أو تريد فرض نوافذ سياق أو قوائم نماذج محددة، أو تريد تعريفات نماذج يدوية بالكامل.

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

  <Tab title="Custom base URL">
    إذا كان Ollama يعمل على مضيف أو منفذ مختلف (يعطل التكوين الصريح الاكتشاف التلقائي، لذلك عرّف النماذج يدويا):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // No /v1 - use native Ollama API URL
            api: "ollama", // Set explicitly to guarantee native tool-calling behavior
            timeoutSeconds: 300, // Optional: give cold local models longer to connect and stream
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // Optional: keep the model loaded between turns
                },
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    لا تضف `/v1` إلى URL. يستخدم مسار `/v1` وضعا متوافقا مع OpenAI، حيث لا يكون استدعاء الأدوات موثوقا. استخدم URL الأساسي لـ Ollama دون لاحقة مسار.
    </Warning>

  </Tab>
</Tabs>

## وصفات شائعة

استخدم هذه كنقاط بداية واستبدل معرّفات النماذج بالأسماء الدقيقة من `ollama list` أو `openclaw models list --provider ollama`.

<AccordionGroup>
  <Accordion title="نموذج محلي مع الاكتشاف التلقائي">
    استخدم هذا عندما يعمل Ollama على الجهاز نفسه مثل Gateway وتريد أن يكتشف OpenClaw النماذج المثبتة تلقائيًا.

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    يبقي هذا المسار الإعدادات في حدها الأدنى. لا تضف كتلة `models.providers.ollama` إلا إذا كنت تريد تعريف النماذج يدويًا.

  </Accordion>

  <Accordion title="مضيف Ollama على الشبكة المحلية مع نماذج يدوية">
    استخدم عناوين URL الأصلية لـ Ollama لمضيفي الشبكة المحلية. لا تضف `/v1`.

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

    `contextWindow` هي ميزانية السياق من جهة OpenClaw. يُرسل `params.num_ctx` إلى Ollama للطلب. أبقهما متوافقين عندما لا يستطيع عتادك تشغيل السياق الكامل المعلن للنموذج.

  </Accordion>

  <Accordion title="Ollama Cloud فقط">
    استخدم هذا عندما لا تشغّل خادومًا محليًا وتريد نماذج Ollama المستضافة مباشرة.

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

  </Accordion>

  <Accordion title="السحابة بالإضافة إلى المحلي عبر خادوم مسجّل الدخول">
    استخدم هذا عندما يكون خادوم Ollama محلي أو على الشبكة المحلية مسجّل الدخول باستخدام `ollama signin` ويجب أن يخدم النماذج المحلية ونماذج `:cloud` معًا.

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

  <Accordion title="عدة مضيفي Ollama">
    استخدم معرّفات موفر مخصصة عندما يكون لديك أكثر من خادم Ollama واحد. يحصل كل موفر على مضيفه ونماذجه ومصادقته ومهلته ومراجع نماذجه الخاصة.

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

    عندما يرسل OpenClaw الطلب، تُزال بادئة الموفر النشط بحيث يصل `ollama-large/qwen3.5:27b` إلى Ollama باسم `qwen3.5:27b`.

  </Accordion>

  <Accordion title="ملف تعريف نموذج محلي خفيف">
    تستطيع بعض النماذج المحلية الإجابة عن المطالبات البسيطة لكنها تواجه صعوبة مع سطح أدوات الوكيل الكامل. ابدأ بتقييد الأدوات والسياق قبل تغيير إعدادات وقت التشغيل العامة.

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

    استخدم `compat.supportsTools: false` فقط عندما يفشل النموذج أو الخادم بشكل موثوق مع مخططات الأدوات. إنه يبادل قدرة الوكيل بالاستقرار.
    يزيل `localModelLean` أدوات المتصفح وCron والرسائل من سطح الوكيل المباشر ويضع الكتالوجات الأكبر افتراضيًا خلف عناصر تحكم Tool Search المنظمة إلا عندما يجب أن يحافظ التشغيل على دلالات تسليم الرسائل المباشر، لكنه لا يغير سياق وقت تشغيل Ollama أو وضع التفكير. اقرنه مع `params.num_ctx` الصريح و`params.thinking: false` لنماذج التفكير الصغيرة بأسلوب Qwen التي تدخل في حلقات أو تنفق ميزانية استجابتها على الاستدلال المخفي.

  </Accordion>
</AccordionGroup>

### اختيار النموذج

بعد الإعداد، تصبح كل نماذج Ollama لديك متاحة:

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

تُدعم أيضًا معرّفات موفر Ollama المخصصة. عندما يستخدم مرجع نموذج بادئة
الموفر النشط، مثل `ollama-spark/qwen3:32b`، يزيل OpenClaw تلك
البادئة فقط قبل استدعاء Ollama بحيث يتلقى الخادم `qwen3:32b`.

بالنسبة للنماذج المحلية البطيئة، فضّل ضبط الطلب على نطاق الموفر قبل زيادة
مهلة وقت تشغيل الوكيل بالكامل:

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

ينطبق `timeoutSeconds` على طلب HTTP للنموذج، بما في ذلك إعداد الاتصال،
والترويسات، وبث الجسم، وإجمالي إلغاء الجلب المحروس. يُمرَّر `params.keep_alive`
إلى Ollama كـ `keep_alive` في المستوى الأعلى في طلبات `/api/chat` الأصلية؛
اضبطه لكل نموذج عندما يكون وقت تحميل أول دور هو عنق الزجاجة.

### تحقق سريع

```bash
# Ollama daemon visible to this machine
curl http://127.0.0.1:11434/api/tags

# OpenClaw catalog and selected model
openclaw models list --provider ollama
openclaw models status

# Direct model smoke
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "Reply with exactly: ok"
```

بالنسبة للمضيفين البعيدين، استبدل `127.0.0.1` بالمضيف المستخدم في `baseUrl`. إذا كان `curl` يعمل لكن OpenClaw لا يعمل، فتحقق مما إذا كان Gateway يعمل على جهاز مختلف أو حاوية أو حساب خدمة مختلف.

## بحث ويب Ollama

يدعم OpenClaw **بحث ويب Ollama** كموفر `web_search` مضمّن.

| الخاصية    | التفاصيل                                                                                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| المضيف        | يستخدم مضيف Ollama الذي أعددته (`models.providers.ollama.baseUrl` عند ضبطه، وإلا `http://127.0.0.1:11434`)؛ يستخدم `https://ollama.com` API المستضاف مباشرة |
| المصادقة        | بدون مفتاح لمضيفي Ollama المحليين المسجّلي الدخول؛ `OLLAMA_API_KEY` أو مصادقة الموفر المعدّة للبحث المباشر عبر `https://ollama.com` أو المضيفين المحميين بالمصادقة               |
| المتطلب | يجب أن تكون المضيفات المحلية/ذاتية الاستضافة قيد التشغيل ومسجّلة الدخول باستخدام `ollama signin`؛ يتطلب البحث المستضاف المباشر `baseUrl: "https://ollama.com"` بالإضافة إلى مفتاح Ollama API حقيقي |

اختر **بحث ويب Ollama** أثناء `openclaw onboard` أو `openclaw configure --section web`، أو اضبط:

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

بالنسبة لخادوم محلي مسجّل الدخول، يستخدم OpenClaw وكيل `/api/experimental/web_search` الخاص بالخادوم. بالنسبة إلى `https://ollama.com`، يستدعي نقطة نهاية `/api/web_search` المستضافة مباشرة.

<Note>
للاطلاع على تفاصيل الإعداد والسلوك الكاملة، راجع [بحث ويب Ollama](/ar/tools/ollama-search).
</Note>

## الإعدادات المتقدمة

<AccordionGroup>
  <Accordion title="وضع التوافق القديم مع OpenAI">
    <Warning>
    **استدعاء الأدوات غير موثوق في وضع التوافق مع OpenAI.** استخدم هذا الوضع فقط إذا كنت تحتاج إلى تنسيق OpenAI لوكيل ولا تعتمد على سلوك استدعاء الأدوات الأصلي.
    </Warning>

    إذا كنت تحتاج إلى استخدام نقطة النهاية المتوافقة مع OpenAI بدلًا من ذلك (على سبيل المثال، خلف وكيل لا يدعم إلا تنسيق OpenAI)، فاضبط `api: "openai-completions"` صراحة:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // default: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    قد لا يدعم هذا الوضع البث واستدعاء الأدوات في آن واحد. قد تحتاج إلى تعطيل البث باستخدام `params: { streaming: false }` في إعدادات النموذج.

    عند استخدام `api: "openai-completions"` مع Ollama، يحقن OpenClaw `options.num_ctx` افتراضيًا حتى لا يعود Ollama بصمت إلى نافذة سياق 4096. إذا كان الوكيل/المنبع يرفض حقول `options` غير المعروفة، فعطّل هذا السلوك:

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
    بالنسبة للنماذج المكتشفة تلقائيًا، يستخدم OpenClaw نافذة السياق التي يبلّغ عنها Ollama عند توفرها، بما في ذلك قيم `PARAMETER num_ctx` الأكبر من Modelfiles المخصصة. وإلا فإنه يعود إلى نافذة سياق Ollama الافتراضية التي يستخدمها OpenClaw.

    يمكنك تعيين قيم افتراضية على مستوى المزوّد لـ `contextWindow` و`contextTokens` و`maxTokens` لكل نموذج ضمن مزوّد Ollama ذلك، ثم تجاوزها لكل نموذج عند الحاجة. `contextWindow` هي ميزانية OpenClaw للموجّه وCompaction. تترك طلبات Ollama الأصلية `options.num_ctx` غير معيّن ما لم تضبط `params.num_ctx` صراحة، بحيث يستطيع Ollama تطبيق القيمة الافتراضية الخاصة بنموذجه أو `OLLAMA_CONTEXT_LENGTH` أو القيمة المبنية على VRAM. لتقييد أو فرض سياق وقت التشغيل لكل طلب في Ollama من دون إعادة بناء Modelfile، عيّن `params.num_ctx`؛ ويتم تجاهل القيم غير الصالحة والصفرية والسالبة وغير المنتهية. إذا رقّيت إعدادًا أقدم كان يستخدم فقط `contextWindow` أو `maxTokens` لفرض سياق طلب Ollama أصلي، فشغّل `openclaw doctor --fix` لنسخ ميزانيات المزوّد أو النموذج الصريحة تلك إلى `params.num_ctx`. ما زال محوّل Ollama المتوافق مع OpenAI يحقن `options.num_ctx` افتراضيًا من `params.num_ctx` أو `contextWindow` المضبوطين؛ عطّل ذلك باستخدام `injectNumCtxForOpenAICompat: false` إذا كان المنبع لديك يرفض `options`.

    تقبل إدخالات نماذج Ollama الأصلية أيضًا خيارات وقت تشغيل Ollama الشائعة ضمن `params`، بما في ذلك `temperature` و`top_p` و`top_k` و`min_p` و`num_predict` و`stop` و`repeat_penalty` و`num_batch` و`num_thread` و`use_mmap`. يمرّر OpenClaw مفاتيح طلب Ollama فقط، لذلك لا تتسرّب معاملات وقت تشغيل OpenClaw مثل `streaming` إلى Ollama. استخدم `params.think` أو `params.thinking` لإرسال `think` على المستوى الأعلى في Ollama؛ وتؤدي القيمة `false` إلى تعطيل التفكير على مستوى API لنماذج التفكير بأسلوب Qwen.

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

    يعمل أيضًا `agents.defaults.models["ollama/<model>"].params.num_ctx` لكل نموذج. إذا ضُبط كلاهما، فإن إدخال نموذج المزوّد الصريح يتغلّب على الإعداد الافتراضي للوكيل.

  </Accordion>

  <Accordion title="التحكم في التفكير">
    بالنسبة إلى نماذج Ollama الأصلية، يمرّر OpenClaw التحكم في التفكير كما يتوقعه Ollama: `think` على المستوى الأعلى، وليس `options.think`. النماذج المكتشفة تلقائيًا التي تتضمن استجابة `/api/show` لديها قدرة `thinking` تعرض `/think low` و`/think medium` و`/think high` و`/think max`؛ أما النماذج غير الداعمة للتفكير فتعرض فقط `/think off`.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    يمكنك أيضًا تعيين إعداد افتراضي للنموذج:

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

    يمكن لـ `params.think` أو `params.thinking` لكل نموذج تعطيل أو فرض تفكير Ollama API لنموذج مضبوط محدد. يحتفظ OpenClaw بمعاملات النموذج الصريحة تلك عندما لا يملك التشغيل النشط إلا القيمة الافتراضية الضمنية `off`؛ وما زالت أوامر وقت التشغيل غير `off` مثل `/think medium` تتجاوز التشغيل النشط.

  </Accordion>

  <Accordion title="نماذج الاستدلال">
    يتعامل OpenClaw افتراضيًا مع النماذج ذات الأسماء مثل `deepseek-r1` أو `reasoning` أو `think` على أنها قادرة على الاستدلال.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    لا يلزم أي إعداد إضافي. يضع OpenClaw عليها علامة تلقائيًا.

  </Accordion>

  <Accordion title="تكاليف النماذج">
    Ollama مجاني ويعمل محليًا، لذلك تُضبط كل تكاليف النماذج على $0. ينطبق هذا على النماذج المكتشفة تلقائيًا والمحددة يدويًا.
  </Accordion>

  <Accordion title="تضمينات الذاكرة">
    يسجّل Ollama Plugin المضمّن مزوّد تضمينات ذاكرة من أجل
    [بحث الذاكرة](/ar/concepts/memory). يستخدم عنوان URL الأساسي وAPI key
    المضبوطين لـ Ollama، ويستدعي نقطة النهاية الحالية `/api/embed` في Ollama،
    ويجمّع عدة أجزاء ذاكرة في طلب `input` واحد متى أمكن.

    عندما يكون `proxy.enabled=true`، تستخدم طلبات تضمين ذاكرة Ollama إلى أصل
    host-local loopback الدقيق المشتق من `baseUrl` المضبوط مسار OpenClaw
    المباشر المحروس بدلًا من وكيل التمرير المدار. يجب أن يكون اسم المضيف المضبوط
    نفسه `localhost` أو قيمة IP حرفية لـ loopback؛ أما أسماء DNS التي تُحلّ فقط
    إلى loopback فتبقى تستخدم مسار الوكيل المدار. كما تبقى مضيفات Ollama على LAN
    وtailnet والشبكات الخاصة والعامة على مسار الوكيل المدار. لا ترث عمليات إعادة
    التوجيه إلى مضيف أو منفذ آخر الثقة. ما زال بإمكان المشغّلين تعيين الإعداد
    العام `proxy.loopbackMode: "proxy"` لإرسال حركة مرور loopback عبر الوكيل،
    أو `proxy.loopbackMode: "block"` لرفض اتصالات loopback قبل فتح اتصال؛ راجع
    [الوكيل المدار](/ar/security/network-proxy#gateway-loopback-mode) لمعرفة
    الأثر على مستوى العملية بالكامل لهذا الإعداد.

    | الخاصية      | القيمة               |
    | ------------- | ------------------- |
    | النموذج الافتراضي | `nomic-embed-text`  |
    | السحب التلقائي     | نعم — يُسحب نموذج التضمين تلقائيًا إذا لم يكن موجودًا محليًا |

    تستخدم التضمينات وقت الاستعلام بادئات الاسترجاع للنماذج التي تتطلبها أو توصي بها، بما في ذلك `nomic-embed-text` و`qwen3-embedding` و`mxbai-embed-large`. تبقى دفعات مستندات الذاكرة خامًا حتى لا تحتاج الفهارس الحالية إلى ترحيل تنسيق.

    لاختيار Ollama كمزوّد تضمينات بحث الذاكرة:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            remote: {
              // Default for Ollama. Raise on larger hosts if reindexing is too slow.
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
    يستخدم تكامل Ollama في OpenClaw **Ollama API الأصلي** (`/api/chat`) افتراضيًا، وهو يدعم البث واستدعاء الأدوات معًا بالكامل. لا يلزم إعداد خاص.

    بالنسبة إلى طلبات `/api/chat` الأصلية، يمرّر OpenClaw أيضًا التحكم في التفكير مباشرة إلى Ollama: يرسل `/think off` و`openclaw agent --thinking off` القيمة `think: false` على المستوى الأعلى ما لم تكن قيمة نموذج صريحة `params.think`/`params.thinking` مضبوطة، بينما ترسل `/think low|medium|high` سلسلة جهد `think` المطابقة على المستوى الأعلى. ويتم ربط `/think max` بأعلى جهد أصلي في Ollama، وهو `think: "high"`.

    <Tip>
    إذا كنت تحتاج إلى استخدام نقطة النهاية المتوافقة مع OpenAI، فراجع قسم "وضع التوافق القديم مع OpenAI" أعلاه. قد لا يعمل البث واستدعاء الأدوات معًا في ذلك الوضع.
    </Tip>

  </Accordion>
</AccordionGroup>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="حلقة تعطل WSL2 (إعادات تشغيل متكررة)">
    على WSL2 مع NVIDIA/CUDA، ينشئ مثبّت Ollama الرسمي لنظام Linux وحدة systemd باسم `ollama.service` تحتوي على `Restart=always`. إذا بدأت تلك الخدمة تلقائيًا وحمّلت نموذجًا مدعومًا من GPU أثناء إقلاع WSL2، يمكن أن يثبّت Ollama ذاكرة المضيف أثناء تحميل النموذج. لا يستطيع استرداد ذاكرة Hyper-V دائمًا استعادة تلك الصفحات المثبّتة، لذلك يمكن أن ينهي Windows آلة WSL2 الافتراضية، ثم يبدأ systemd تشغيل Ollama مجددًا، وتتكرر الحلقة.

    أدلة شائعة:

    - عمليات إعادة تشغيل أو إنهاء متكررة لـ WSL2 من جانب Windows
    - استهلاك CPU مرتفع في `app.slice` أو `ollama.service` بعد وقت قصير من بدء WSL2
    - SIGTERM من systemd بدلًا من حدث Linux OOM-killer

    يسجل OpenClaw تحذير بدء تشغيل عندما يكتشف WSL2، و`ollama.service` مفعّلًا مع `Restart=always`، وواسمات CUDA مرئية.

    التخفيف:

    ```bash
    sudo systemctl disable ollama
    ```

    أضف هذا إلى `%USERPROFILE%\.wslconfig` على جانب Windows، ثم شغّل `wsl --shutdown`:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    عيّن مدة keep-alive أقصر في بيئة خدمة Ollama، أو ابدأ Ollama يدويًا فقط عندما تحتاج إليه:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    راجع [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317).

  </Accordion>

  <Accordion title="لم يتم اكتشاف Ollama">
    تأكد من أن Ollama قيد التشغيل وأنك عيّنت `OLLAMA_API_KEY` (أو ملف مصادقة)، وأنك **لم** تعرّف إدخالًا صريحًا لـ `models.providers.ollama`:

    ```bash
    ollama serve
    ```

    تحقّق من إمكانية الوصول إلى API:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="لا توجد نماذج متاحة">
    إذا لم يكن نموذجك مدرجًا، فاسحب النموذج محليًا أو عرّفه صراحة في `models.providers.ollama`.

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="تم رفض الاتصال">
    تحقّق من أن Ollama يعمل على المنفذ الصحيح:

    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="المضيف البعيد يعمل مع curl ولكن ليس مع OpenClaw">
    تحقّق من الجهاز ووقت التشغيل نفسيهما اللذين يشغّلان Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    أسباب شائعة:

    - يشير `baseUrl` إلى `localhost`، لكن Gateway يعمل في Docker أو على مضيف آخر.
    - يستخدم عنوان URL المسار `/v1`، ما يختار سلوكًا متوافقًا مع OpenAI بدلًا من Ollama الأصلي.
    - يحتاج المضيف البعيد إلى تغييرات في جدار الحماية أو ربط LAN من جانب Ollama.
    - النموذج موجود على برنامج الخدمة في حاسوبك المحمول لكنه غير موجود على برنامج الخدمة البعيد.

  </Accordion>

  <Accordion title="يُخرج النموذج JSON الأدوات كنص">
    يعني هذا عادةً أن المزوّد يستخدم وضع التوافق مع OpenAI أو أن النموذج لا يستطيع التعامل مع مخططات الأدوات.

    فضّل وضع Ollama الأصلي:

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

    إذا ظل نموذج محلي صغير يفشل مع مخططات الأدوات، فعيّن `compat.supportsTools: false` على إدخال ذلك النموذج وأعد الاختبار.

  </Accordion>

  <Accordion title="يعيد Kimi أو GLM رموزًا مشوّهة">
    تُعامل استجابات Kimi/GLM المستضافة التي تكون طويلة وغير لغوية ومكوّنة من تتابعات رموز على أنها مخرجات مزوّد فاشلة بدلًا من إجابة مساعد ناجحة. يتيح ذلك لآليات إعادة المحاولة أو الرجوع الاحتياطي أو معالجة الأخطاء العادية تولي الأمر من دون حفظ النص التالف في الجلسة.

    إذا تكرر ذلك، فالتقط اسم النموذج الخام وملف الجلسة الحالي وما إذا كان التشغيل قد استخدم `Cloud + Local` أو `Cloud only`، ثم جرّب جلسة جديدة ونموذجًا احتياطيًا:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="انتهاء مهلة النموذج المحلي البارد">
    قد تحتاج النماذج المحلية الكبيرة إلى تحميل أول طويل قبل أن يبدأ البث. أبقِ المهلة محصورة بمزوّد Ollama، ويمكنك اختياريًا أن تطلب من Ollama إبقاء النموذج محمّلًا بين الأدوار:

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

    إذا كان المضيف نفسه بطيئًا في قبول الاتصالات، فإن `timeoutSeconds` يمدّد أيضًا مهلة اتصال Undici المحروسة لهذا المزوّد.

  </Accordion>

  <Accordion title="النموذج كبير السياق بطيء جدًا أو تنفد ذاكرته">
    تعلن كثير من نماذج Ollama عن سياقات أكبر مما يمكن لعتادك تشغيله بشكل مريح. يستخدم Ollama الأصلي القيمة الافتراضية لسياق وقت التشغيل الخاصة بـ Ollama ما لم تضبط `params.num_ctx`. حدّد سقفًا لكل من ميزانية OpenClaw وسياق طلب Ollama عندما تريد زمن وصول متوقعًا لأول رمز:

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

    خفّض `contextWindow` أولًا إذا كان OpenClaw يرسل موجهًا كبيرًا جدًا. خفّض `params.num_ctx` إذا كان Ollama يحمّل سياق وقت تشغيل أكبر مما تتحمله الآلة. خفّض `maxTokens` إذا كان التوليد يستغرق وقتًا طويلًا جدًا.

  </Accordion>
</AccordionGroup>

<Note>
مزيد من المساعدة: [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) و[الأسئلة الشائعة](/ar/help/faq).
</Note>

## ذات صلة

<CardGroup cols={2}>
  <Card title="مزوّدو النماذج" href="/ar/concepts/model-providers" icon="layers">
    نظرة عامة على جميع المزوّدين، ومراجع النماذج، وسلوك تجاوز الفشل.
  </Card>
  <Card title="اختيار النموذج" href="/ar/concepts/models" icon="brain">
    كيفية اختيار النماذج وتهيئتها.
  </Card>
  <Card title="بحث الويب في Ollama" href="/ar/tools/ollama-search" icon="magnifying-glass">
    تفاصيل الإعداد والسلوك الكاملة لبحث الويب المدعوم من Ollama.
  </Card>
  <Card title="التهيئة" href="/ar/gateway/configuration" icon="gear">
    مرجع التهيئة الكامل.
  </Card>
</CardGroup>
