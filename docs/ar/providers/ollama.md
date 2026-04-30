---
read_when:
    - تريد تشغيل OpenClaw باستخدام نماذج سحابية أو محلية عبر Ollama
    - تحتاج إلى إرشادات لإعداد Ollama وتكوينه
    - تريد استخدام نماذج الرؤية من Ollama لفهم الصور
summary: تشغيل OpenClaw باستخدام Ollama (النماذج السحابية والمحلية)
title: Ollama
x-i18n:
    generated_at: "2026-04-30T08:22:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6eeaebc0ba72f72a0dee842f7d983a552c86cfa23271322d4740641124f57cfb
    source_path: providers/ollama.md
    workflow: 16
---

يدمج OpenClaw مع واجهة Ollama الأصلية (`/api/chat`) لنماذج السحابة المستضافة وخوادم Ollama المحلية/ذاتية الاستضافة. يمكنك استخدام Ollama بثلاثة أوضاع: `Cloud + Local` عبر مضيف Ollama قابل للوصول، أو `Cloud only` عبر `https://ollama.com`، أو `Local only` عبر مضيف Ollama قابل للوصول.

<Warning>
**مستخدمو Ollama البعيد**: لا تستخدم عنوان URL المتوافق مع OpenAI `/v1` ‏(`http://host:11434/v1`) مع OpenClaw. يؤدي ذلك إلى تعطيل استدعاء الأدوات وقد تُخرج النماذج JSON الخاص بالأدوات الخام كنص عادي. استخدم عنوان URL الأصلي لواجهة Ollama API بدلاً من ذلك: `baseUrl: "http://host:11434"` (بدون `/v1`).
</Warning>

يستخدم إعداد موفر Ollama المفتاح `baseUrl` كمفتاح أساسي. يقبل OpenClaw أيضاً `baseURL` للتوافق مع أمثلة أسلوب OpenAI SDK، لكن يجب أن تفضل الإعدادات الجديدة `baseUrl`.

## قواعد المصادقة

<AccordionGroup>
  <Accordion title="المضيفون المحليون ومضيفو LAN">
    لا تحتاج مضيفات Ollama المحلية ومضيفات LAN إلى رمز حامل حقيقي. يستخدم OpenClaw واسم `ollama-local` المحلي فقط لعناوين URL الأساسية الخاصة بـ Ollama التي تستخدم local loopback والشبكة الخاصة و`.local` وأسماء المضيف العارية.
  </Accordion>
  <Accordion title="المضيفون البعيدون ومضيفو Ollama Cloud">
    تتطلب المضيفات العامة البعيدة وOllama Cloud ‏(`https://ollama.com`) اعتماداً حقيقياً عبر `OLLAMA_API_KEY` أو ملف تعريف مصادقة أو `apiKey` الخاص بالموفر.
  </Accordion>
  <Accordion title="معرّفات الموفر المخصصة">
    تتبع معرّفات الموفر المخصصة التي تضبط `api: "ollama"` القواعد نفسها. على سبيل المثال، يمكن لموفر `ollama-remote` يشير إلى مضيف Ollama خاص على LAN أن يستخدم `apiKey: "ollama-local"`، وستحل الوكلاء الفرعية ذلك الوسم عبر خطاف موفر Ollama بدلاً من معاملته كاعتماد مفقود. يمكن لبحث الذاكرة أيضاً ضبط `agents.defaults.memorySearch.provider` على معرّف الموفر المخصص هذا لكي تستخدم التضمينات نقطة نهاية Ollama المطابقة.
  </Accordion>
  <Accordion title="ملفات تعريف المصادقة">
    يخزن `auth-profiles.json` الاعتماد لمعرّف موفر. ضع إعدادات نقطة النهاية (`baseUrl` و`api` ومعرّفات النماذج والرؤوس والمهلات) في `models.providers.<id>`. ملفات تعريف المصادقة المسطحة الأقدم مثل `{ "ollama-windows": { "apiKey": "ollama-local" } }` ليست صيغة تشغيل؛ شغّل `openclaw doctor --fix` لإعادة كتابتها إلى ملف تعريف مفتاح API الأساسي `ollama-windows:default` مع نسخة احتياطية. وجود `baseUrl` في ذلك الملف ضجيج توافق ويجب نقله إلى إعداد الموفر.
  </Accordion>
  <Accordion title="نطاق تضمين الذاكرة">
    عند استخدام Ollama لتضمينات الذاكرة، تُحصر مصادقة الحامل في المضيف الذي أُعلنت فيه:

    - يُرسل مفتاح مستوى الموفر فقط إلى مضيف Ollama الخاص بذلك الموفر.
    - يُرسل `agents.*.memorySearch.remote.apiKey` فقط إلى مضيف التضمين البعيد الخاص به.
    - تُعامل قيمة البيئة `OLLAMA_API_KEY` الخالصة كاصطلاح Ollama Cloud، ولا تُرسل افتراضياً إلى المضيفات المحلية أو ذاتية الاستضافة.

  </Accordion>
</AccordionGroup>

## بدء الاستخدام

اختر طريقة الإعداد والوضع المفضلين لديك.

<Tabs>
  <Tab title="الإعداد الأولي (موصى به)">
    **الأفضل لـ:** أسرع مسار إلى إعداد Ollama سحابي أو محلي عامل.

    <Steps>
      <Step title="تشغيل الإعداد الأولي">
        ```bash
        openclaw onboard
        ```

        اختر **Ollama** من قائمة الموفرين.
      </Step>
      <Step title="اختيار وضعك">
        - **Cloud + Local** — مضيف Ollama محلي إضافة إلى نماذج سحابية تُمرر عبر ذلك المضيف
        - **Cloud only** — نماذج Ollama مستضافة عبر `https://ollama.com`
        - **Local only** — نماذج محلية فقط

      </Step>
      <Step title="اختيار نموذج">
        يطلب `Cloud only` قيمة `OLLAMA_API_KEY` ويقترح افتراضيات سحابية مستضافة. يطلب `Cloud + Local` و`Local only` عنوان URL أساسياً لـ Ollama، ويكتشفان النماذج المتاحة، ويسحبان تلقائياً النموذج المحلي المحدد إذا لم يكن متاحاً بعد. عندما يبلغ Ollama عن وسم `:latest` مثبت مثل `gemma4:latest`، يعرض الإعداد ذلك النموذج المثبت مرة واحدة بدلاً من عرض كل من `gemma4` و`gemma4:latest` أو سحب الاسم المستعار العاري مرة أخرى. يتحقق `Cloud + Local` أيضاً مما إذا كان مضيف Ollama هذا مسجلاً دخوله للوصول السحابي.
      </Step>
      <Step title="التحقق من توفر النموذج">
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

    يمكنك اختيارياً تحديد عنوان URL أساسي مخصص أو نموذج:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="الإعداد اليدوي">
    **الأفضل لـ:** تحكم كامل في الإعداد السحابي أو المحلي.

    <Steps>
      <Step title="اختيار السحابة أو المحلي">
        - **Cloud + Local**: ثبّت Ollama، وسجّل الدخول باستخدام `ollama signin`، ومرّر طلبات السحابة عبر ذلك المضيف
        - **Cloud only**: استخدم `https://ollama.com` مع `OLLAMA_API_KEY`
        - **Local only**: ثبّت Ollama من [ollama.com/download](https://ollama.com/download)

      </Step>
      <Step title="سحب نموذج محلي (محلي فقط)">
        ```bash
        ollama pull gemma4
        # or
        ollama pull gpt-oss:20b
        # or
        ollama pull llama3.3
        ```
      </Step>
      <Step title="تمكين Ollama لـ OpenClaw">
        بالنسبة إلى `Cloud only`، استخدم قيمة `OLLAMA_API_KEY` الحقيقية لديك. بالنسبة إلى الإعدادات المدعومة بمضيف، تعمل أي قيمة بديلة:

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # Or configure in your config file
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="فحص نموذجك وضبطه">
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

## نماذج السحابة

<Tabs>
  <Tab title="Cloud + Local">
    يستخدم `Cloud + Local` مضيف Ollama قابل للوصول كنقطة تحكم لكل من النماذج المحلية والسحابية. هذا هو التدفق الهجين المفضل لدى Ollama.

    استخدم **Cloud + Local** أثناء الإعداد. يطلب OpenClaw عنوان URL الأساسي لـ Ollama، ويكتشف النماذج المحلية من ذلك المضيف، ويتحقق مما إذا كان المضيف مسجلاً دخوله للوصول السحابي باستخدام `ollama signin`. عندما يكون المضيف مسجلاً الدخول، يقترح OpenClaw أيضاً افتراضيات سحابية مستضافة مثل `kimi-k2.5:cloud` و`minimax-m2.7:cloud` و`glm-5.1:cloud`.

    إذا لم يكن المضيف مسجلاً الدخول بعد، يبقي OpenClaw الإعداد محلياً فقط إلى أن تشغّل `ollama signin`.

  </Tab>

  <Tab title="Cloud only">
    يعمل `Cloud only` عبر واجهة Ollama API المستضافة على `https://ollama.com`.

    استخدم **Cloud only** أثناء الإعداد. يطلب OpenClaw قيمة `OLLAMA_API_KEY`، ويضبط `baseUrl: "https://ollama.com"`، ويمهد قائمة النماذج السحابية المستضافة. لا يتطلب هذا المسار خادم Ollama محلياً أو `ollama signin`.

    تُملأ قائمة النماذج السحابية المعروضة أثناء `openclaw onboard` مباشرة من `https://ollama.com/api/tags`، وبحد أقصى 500 إدخال، لذلك يعكس المنتقي الكتالوج المستضاف الحالي بدلاً من بذرة ثابتة. إذا تعذر الوصول إلى `ollama.com` أو لم يُرجع نماذج وقت الإعداد، يعود OpenClaw إلى الاقتراحات السابقة المشفرة ثابتاً لكي يكتمل الإعداد الأولي.

  </Tab>

  <Tab title="Local only">
    في وضع المحلي فقط، يكتشف OpenClaw النماذج من نسخة Ollama المضبوطة. هذا المسار مخصص لخوادم Ollama المحلية أو ذاتية الاستضافة.

    يقترح OpenClaw حالياً `gemma4` كافتراضي محلي.

  </Tab>
</Tabs>

## اكتشاف النماذج (موفر ضمني)

عندما تضبط `OLLAMA_API_KEY` (أو ملف تعريف مصادقة) و**لا** تعرّف `models.providers.ollama` أو موفراً بعيداً مخصصاً آخر مع `api: "ollama"`، يكتشف OpenClaw النماذج من نسخة Ollama المحلية على `http://127.0.0.1:11434`.

| السلوك              | التفاصيل                                                                                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| استعلام الكتالوج        | يستعلم `/api/tags`                                                                                                                                                  |
| اكتشاف القدرات | يستخدم عمليات بحث `/api/show` بأفضل جهد لقراءة `contextWindow`، ومعلمات `num_ctx` الموسعة في Modelfile، والقدرات بما فيها الرؤية/الأدوات                       |
| نماذج الرؤية        | النماذج التي تبلغ `/api/show` عن قدرة `vision` لها تُوسم بأنها قادرة على الصور (`input: ["text", "image"]`)، لذلك يحقن OpenClaw الصور تلقائياً في الموجه  |
| اكتشاف الاستدلال  | يستخدم قدرات `/api/show` عند توفرها، بما في ذلك `thinking`؛ ويعود إلى استدلال من اسم النموذج (`r1` و`reasoning` و`think`) عندما يحذف Ollama القدرات |
| حدود الرموز         | يضبط `maxTokens` على سقف الحد الأقصى الافتراضي للرموز في Ollama الذي يستخدمه OpenClaw                                                                                                |
| التكاليف                | يضبط كل التكاليف على `0`                                                                                                                                                |

يتجنب هذا إدخالات النماذج اليدوية مع إبقاء الكتالوج متوافقاً مع نسخة Ollama المحلية. يمكنك استخدام مرجع كامل مثل `ollama/<pulled-model>:latest` في `infer model run` المحلي؛ يحل OpenClaw ذلك النموذج المثبت من كتالوج Ollama المباشر دون الحاجة إلى إدخال `models.json` مكتوب يدوياً.

بالنسبة إلى مضيفات Ollama المسجلة الدخول، قد تكون بعض نماذج `:cloud` قابلة للاستخدام عبر `/api/chat`
و`/api/show` قبل أن تظهر في `/api/tags`. عندما تحدد صراحة مرجعاً
كاملاً `ollama/<model>:cloud`، يتحقق OpenClaw من ذلك النموذج المفقود بعينه عبر
`/api/show` ويضيفه إلى كتالوج التشغيل فقط إذا أكد Ollama بيانات النموذج
الوصفية. لا تزال الأخطاء المطبعية تفشل كنماذج غير معروفة بدلاً من إنشائها تلقائياً.

```bash
# See what models are available
ollama list
openclaw models list
```

لاختبار smoke ضيق لتوليد النص يتجنب سطح أدوات الوكيل الكامل،
استخدم `infer model run` المحلي مع مرجع نموذج Ollama كامل:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

لا يزال ذلك المسار يستخدم موفر OpenClaw المضبوط والمصادقة والنقل الأصلي لـ Ollama،
لكنه لا يبدأ دورة وكيل دردشة ولا يحمّل سياق MCP/الأدوات. إذا
نجح هذا بينما تفشل ردود الوكيل العادية، فاستكشف بعد ذلك سعة موجه/أدوات
الوكيل الخاصة بالنموذج.

لاختبار smoke ضيق لنموذج رؤية على المسار الخفيف نفسه، أضف ملف صورة واحداً أو أكثر
إلى `infer model run`. يرسل هذا الموجه والصورة مباشرة إلى
نموذج رؤية Ollama المحدد دون تحميل أدوات الدردشة أو الذاكرة أو سياق
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

يقبل `model run --file` الملفات المكتشفة كـ `image/*`، بما في ذلك مدخلات PNG
وJPEG وWebP الشائعة. تُرفض الملفات غير الصورية قبل استدعاء Ollama.
للتعرف على الكلام، استخدم `openclaw infer audio transcribe` بدلاً من ذلك.

عندما تبدّل محادثة باستخدام `/model ollama/<model>`، يتعامل OpenClaw مع
ذلك كتحديد مستخدم دقيق. إذا كان `baseUrl` المضبوط لـ Ollama
غير قابل للوصول، يفشل الرد التالي بخطأ الموفر بدلاً من الرد بصمت
من نموذج احتياطي مضبوط آخر.

مهام Cron المعزولة تنفذ فحص أمان محليًا إضافيًا قبل أن تبدأ
دورة الوكيل. إذا كان النموذج المحدد يُحل إلى موفر Ollama محلي أو على شبكة خاصة أو `.local`
وكان `/api/tags` غير قابل للوصول، يسجل OpenClaw تشغيل Cron ذلك
كـ `skipped` مع `ollama/<model>` المحدد في نص الخطأ. يتم تخزين فحص
نقطة النهاية المسبق مؤقتًا لمدة 5 دقائق، لذلك لا تطلق عدة مهام Cron موجهة إلى نفس
خادم Ollama المتوقف طلبات نماذج فاشلة كلها.

تحقق حيًا من مسار النص المحلي، ومسار البث الأصلي، والتضمينات مقابل
Ollama المحلي باستخدام:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

لإضافة نموذج جديد، اسحبه ببساطة باستخدام Ollama:

```bash
ollama pull mistral
```

سيتم اكتشاف النموذج الجديد تلقائيًا وسيكون متاحًا للاستخدام.

<Note>
إذا عيّنت `models.providers.ollama` صراحةً، أو كوّنت موفرًا بعيدًا مخصصًا مثل `models.providers.ollama-cloud` مع `api: "ollama"`، يتم تخطي الاكتشاف التلقائي ويجب عليك تعريف النماذج يدويًا. لا يزال يتم التعامل مع الموفرين المخصصين عبر loopback مثل `http://127.0.0.2:11434` كموفرين محليين. راجع قسم التكوين الصريح أدناه.
</Note>

## الرؤية ووصف الصور

يسجل Plugin Ollama المضمن Ollama كموفر قادر على الصور لفهم الوسائط. يتيح هذا لـ OpenClaw توجيه طلبات وصف الصور الصريحة وافتراضيات نماذج الصور المكوّنة عبر نماذج رؤية Ollama المحلية أو المستضافة.

للرؤية المحلية، اسحب نموذجًا يدعم الصور:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

ثم تحقق باستخدام infer CLI:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

يجب أن يكون `--model` مرجعًا كاملًا بصيغة `<provider/model>`. عند تعيينه، يشغّل `openclaw infer image describe` ذلك النموذج مباشرة بدلًا من تخطي الوصف لأن النموذج يدعم الرؤية الأصلية.

استخدم `infer image describe` عندما تريد تدفق موفر فهم الصور في OpenClaw، و`agents.defaults.imageModel` المكوّن، وشكل مخرجات وصف الصور. استخدم `infer model run --file` عندما تريد فحصًا خامًا لنموذج متعدد الوسائط مع مطالبة مخصصة وصورة واحدة أو أكثر.

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

فضّل المرجع الكامل `ollama/<model>`. إذا كان النموذج نفسه مدرجًا ضمن `models.providers.ollama.models` مع `input: ["text", "image"]` ولا يكشف أي موفر صور مكوّن آخر معرّف النموذج المجرد نفسه، يقوم OpenClaw أيضًا بتطبيع مرجع `imageModel` مجرد مثل `qwen2.5vl:7b` إلى `ollama/qwen2.5vl:7b`. إذا كان لدى أكثر من موفر صور مكوّن المعرّف المجرد نفسه، فاستخدم بادئة الموفر صراحةً.

قد تحتاج نماذج الرؤية المحلية البطيئة إلى مهلة أطول لفهم الصور من نماذج السحابة. كما يمكن أن تتعطل أو تتوقف عندما يحاول Ollama تخصيص سياق الرؤية الكامل المعلن عنه على عتاد محدود. عيّن مهلة للقدرة، وحدد سقفًا لـ `num_ctx` في إدخال النموذج عندما لا تحتاج إلا إلى دورة وصف صورة عادية:

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

تنطبق هذه المهلة على فهم الصور الواردة وعلى أداة `image` الصريحة التي يستطيع الوكيل استدعاءها أثناء دورة. لا يزال `models.providers.ollama.timeoutSeconds` على مستوى الموفر يتحكم في حارس طلب HTTP الأساسي إلى Ollama لاستدعاءات النموذج العادية.

تحقق حيًا من أداة الصور الصريحة مقابل Ollama المحلي باستخدام:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

إذا عرّفت `models.providers.ollama.models` يدويًا، فميّز نماذج الرؤية بدعم إدخال الصور:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

يرفض OpenClaw طلبات وصف الصور للنماذج غير المعلّمة كقادرة على الصور. مع الاكتشاف الضمني، يقرأ OpenClaw هذا من Ollama عندما يبلغ `/api/show` عن قدرة رؤية.

## التكوين

<Tabs>
  <Tab title="أساسي (اكتشاف ضمني)">
    أبسط مسار تمكين محلي فقط يكون عبر متغير بيئة:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    إذا كان `OLLAMA_API_KEY` معيّنًا، يمكنك حذف `apiKey` في إدخال الموفر وسيملؤه OpenClaw لفحوصات التوفر.
    </Tip>

  </Tab>

  <Tab title="صريح (نماذج يدوية)">
    استخدم التكوين الصريح عندما تريد إعدادًا سحابيًا مستضافًا، أو عندما يعمل Ollama على مضيف/منفذ آخر، أو تريد فرض نوافذ سياق أو قوائم نماذج محددة، أو تريد تعريفات نماذج يدوية بالكامل.

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
    إذا كان Ollama يعمل على مضيف أو منفذ مختلف (يعطل التكوين الصريح الاكتشاف التلقائي، لذلك عرّف النماذج يدويًا):

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
    لا تضف `/v1` إلى عنوان URL. يستخدم المسار `/v1` وضعًا متوافقًا مع OpenAI، حيث لا يكون استدعاء الأدوات موثوقًا. استخدم عنوان URL الأساسي لـ Ollama بدون لاحقة مسار.
    </Warning>

  </Tab>
</Tabs>

## وصفات شائعة

استخدم هذه كنقاط بداية واستبدل معرفات النماذج بالأسماء الدقيقة من `ollama list` أو `openclaw models list --provider ollama`.

<AccordionGroup>
  <Accordion title="نموذج محلي مع اكتشاف تلقائي">
    استخدم هذا عندما يعمل Ollama على الجهاز نفسه مثل Gateway وتريد أن يكتشف OpenClaw النماذج المثبتة تلقائيًا.

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    يبقي هذا المسار التكوين في الحد الأدنى. لا تضف كتلة `models.providers.ollama` إلا إذا كنت تريد تعريف النماذج يدويًا.

  </Accordion>

  <Accordion title="مضيف Ollama على LAN مع نماذج يدوية">
    استخدم عناوين URL الأصلية لـ Ollama لمضيفي LAN. لا تضف `/v1`.

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

    `contextWindow` هي ميزانية السياق من جانب OpenClaw. يتم إرسال `params.num_ctx` إلى Ollama للطلب. أبقهما متوافقين عندما لا يستطيع عتادك تشغيل السياق الكامل المعلن عنه للنموذج.

  </Accordion>

  <Accordion title="Ollama Cloud فقط">
    استخدم هذا عندما لا تشغّل خادمًا محليًا وتريد نماذج Ollama المستضافة مباشرة.

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

  <Accordion title="السحابة إضافة إلى المحلي عبر خادم مسجّل الدخول">
    استخدم هذا عندما يكون خادم Ollama محلي أو على LAN مسجّل الدخول باستخدام `ollama signin` ويجب أن يخدم النماذج المحلية ونماذج `:cloud` معًا.

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

  <Accordion title="عدة مضيفين لـ Ollama">
    استخدم معرفات موفر مخصصة عندما يكون لديك أكثر من خادم Ollama واحد. يحصل كل موفر على مضيفه ونماذجه ومصادقته ومهلته ومراجع نماذجه الخاصة.

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

    عندما يرسل OpenClaw الطلب، تتم إزالة بادئة الموفر النشط بحيث يصل `ollama-large/qwen3.5:27b` إلى Ollama كـ `qwen3.5:27b`.

  </Accordion>

  <Accordion title="ملف تعريف نموذج محلي خفيف">
    يمكن لبعض النماذج المحلية الإجابة عن مطالبات بسيطة لكنها تواجه صعوبة مع سطح أدوات الوكيل الكامل. ابدأ بتقييد الأدوات والسياق قبل تغيير إعدادات وقت التشغيل العامة.

    ```json5
    {
      agents: {
        defaults: {
          experimental: {
            localModelLean: true,
          },
          model: { primary: "ollama/gemma4" },
        },
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

    استخدم `compat.supportsTools: false` فقط عندما يفشل النموذج أو الخادم بشكل موثوق مع مخططات الأدوات. هذا يستبدل جزءًا من قدرة الوكيل بمزيد من الاستقرار.
    يزيل `localModelLean` المتصفح وCron وأدوات الرسائل من سطح الوكيل، لكنه لا يغيّر سياق تشغيل Ollama أو وضع التفكير. اقرنه بـ `params.num_ctx` صريح و`params.thinking: false` لنماذج التفكير الصغيرة بأسلوب Qwen التي تدخل في حلقات أو تستهلك ميزانية الاستجابة في الاستدلال المخفي.

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

تُدعم أيضًا معرّفات موفري Ollama المخصصة. عندما يستخدم مرجع نموذج بادئة الموفر النشط، مثل `ollama-spark/qwen3:32b`، يزيل OpenClaw تلك البادئة فقط قبل استدعاء Ollama كي يتلقى الخادم `qwen3:32b`.

للنماذج المحلية البطيئة، فضّل ضبط الطلب على نطاق الموفر قبل رفع مهلة تشغيل الوكيل بالكامل:

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

ينطبق `timeoutSeconds` على طلب HTTP للنموذج، بما في ذلك إعداد الاتصال، والترويسات، وبث الجسم، وإيقاف الجلب المحروس الإجمالي. يُمرَّر `params.keep_alive` إلى Ollama كـ `keep_alive` من المستوى الأعلى في طلبات `/api/chat` الأصلية؛ عيّنه لكل نموذج عندما يكون وقت تحميل الدور الأول هو عنق الزجاجة.

### التحقق السريع

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

للمضيفين البعيدين، استبدل `127.0.0.1` بالمضيف المستخدم في `baseUrl`. إذا كان `curl` يعمل لكن OpenClaw لا يعمل، فتحقق مما إذا كان Gateway يعمل على جهاز أو حاوية أو حساب خدمة مختلف.

## بحث Ollama على الويب

يدعم OpenClaw **بحث Ollama على الويب** كموفر `web_search` مضمّن.

| الخاصية | التفاصيل |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| المضيف | يستخدم مضيف Ollama المُعدّ لديك (`models.providers.ollama.baseUrl` عند ضبطه، وإلا `http://127.0.0.1:11434`)؛ يستخدم `https://ollama.com` واجهة API المستضافة مباشرة |
| المصادقة | بلا مفتاح لمضيفي Ollama المحليين المسجّل دخولهم؛ `OLLAMA_API_KEY` أو مصادقة الموفر المُعدّة للبحث المباشر عبر `https://ollama.com` أو المضيفين المحميين بالمصادقة |
| المتطلب | يجب أن تكون المضيفات المحلية/ذاتية الاستضافة قيد التشغيل ومسجّلًا دخولها باستخدام `ollama signin`؛ يتطلب البحث المستضاف المباشر `baseUrl: "https://ollama.com"` بالإضافة إلى مفتاح Ollama API حقيقي |

اختر **بحث Ollama على الويب** أثناء `openclaw onboard` أو `openclaw configure --section web`، أو اضبط:

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

بالنسبة إلى عفريت محلي مسجّل الدخول، يستخدم OpenClaw وكيل العفريت `/api/experimental/web_search`. وبالنسبة إلى `https://ollama.com`، يستدعي نقطة النهاية المستضافة `/api/web_search` مباشرة.

<Note>
للحصول على تفاصيل الإعداد والسلوك الكاملة، راجع [بحث Ollama على الويب](/ar/tools/ollama-search).
</Note>

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="Legacy OpenAI-compatible mode">
    <Warning>
    **استدعاء الأدوات غير موثوق في الوضع المتوافق مع OpenAI.** استخدم هذا الوضع فقط إذا كنت تحتاج إلى تنسيق OpenAI لوكيل وسيط ولا تعتمد على سلوك استدعاء الأدوات الأصلي.
    </Warning>

    إذا كنت تحتاج إلى استخدام نقطة النهاية المتوافقة مع OpenAI بدلًا من ذلك (مثلًا خلف وكيل وسيط لا يدعم إلا تنسيق OpenAI)، فاضبط `api: "openai-completions"` صراحة:

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

    قد لا يدعم هذا الوضع البث واستدعاء الأدوات في الوقت نفسه. قد تحتاج إلى تعطيل البث باستخدام `params: { streaming: false }` في إعداد النموذج.

    عند استخدام `api: "openai-completions"` مع Ollama، يحقن OpenClaw القيمة `options.num_ctx` افتراضيًا حتى لا يعود Ollama بصمت إلى نافذة سياق 4096. إذا كان الوكيل الوسيط/المنبع يرفض حقول `options` غير المعروفة، فعطّل هذا السلوك:

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

  <Accordion title="Context windows">
    بالنسبة إلى النماذج المكتشفة تلقائيًا، يستخدم OpenClaw نافذة السياق التي يبلغ عنها Ollama عند توفرها، بما في ذلك قيم `PARAMETER num_ctx` الأكبر من ملفات Modelfile المخصصة. وإلا فإنه يعود إلى نافذة سياق Ollama الافتراضية التي يستخدمها OpenClaw.

    يمكنك ضبط القيم الافتراضية `contextWindow` و`contextTokens` و`maxTokens` على مستوى الموفر لكل نموذج ضمن موفر Ollama ذلك، ثم تجاوزها لكل نموذج عند الحاجة. `contextWindow` هي ميزانية المطالبة وCompaction في OpenClaw. تترك طلبات Ollama الأصلية `options.num_ctx` غير مضبوطة ما لم تُعدّ `params.num_ctx` صراحة، كي يتمكن Ollama من تطبيق نموذجه الخاص أو `OLLAMA_CONTEXT_LENGTH` أو القيمة الافتراضية المستندة إلى VRAM. للحد من سياق تشغيل Ollama لكل طلب أو فرضه بدون إعادة بناء Modelfile، اضبط `params.num_ctx`؛ يتم تجاهل القيم غير الصالحة، والصفرية، والسالبة، وغير المنتهية. ما زال محوّل Ollama المتوافق مع OpenAI يحقن `options.num_ctx` افتراضيًا من `params.num_ctx` أو `contextWindow` المُعدّة؛ عطّل ذلك باستخدام `injectNumCtxForOpenAICompat: false` إذا كان المنبع يرفض `options`.

    تقبل إدخالات نماذج Ollama الأصلية أيضًا خيارات تشغيل Ollama الشائعة ضمن `params`، بما في ذلك `temperature` و`top_p` و`top_k` و`min_p` و`num_predict` و`stop` و`repeat_penalty` و`num_batch` و`num_thread` و`use_mmap`. يمرر OpenClaw مفاتيح طلب Ollama فقط، لذلك لا تتسرب معاملات تشغيل OpenClaw مثل `streaming` إلى Ollama. استخدم `params.think` أو `params.thinking` لإرسال `think` الخاص بـ Ollama من المستوى الأعلى؛ تعطل `false` التفكير على مستوى API لنماذج التفكير بأسلوب Qwen.

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

    تعمل أيضًا `agents.defaults.models["ollama/<model>"].params.num_ctx` لكل نموذج. إذا تم إعداد كليهما، يفوز إدخال نموذج الموفر الصريح على الإعداد الافتراضي للوكيل.

  </Accordion>

  <Accordion title="Thinking control">
    بالنسبة إلى نماذج Ollama الأصلية، يمرر OpenClaw التحكم في التفكير كما يتوقعه Ollama: `think` من المستوى الأعلى، وليس `options.think`. النماذج المكتشفة تلقائيًا التي تتضمن استجابة `/api/show` لديها قدرة `thinking` تعرض `/think low` و`/think medium` و`/think high` و`/think max`؛ أما النماذج غير المفكرة فتعرض فقط `/think off`.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    يمكنك أيضًا ضبط إعداد افتراضي للنموذج:

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

    يمكن لـ `params.think` أو `params.thinking` لكل نموذج تعطيل أو فرض تفكير Ollama API لنموذج مُعدّ محدد. يحافظ OpenClaw على معاملات النموذج الصريحة هذه عندما لا يحتوي التشغيل النشط إلا على الإعداد الافتراضي الضمني `off`؛ أما أوامر وقت التشغيل غير `off` مثل `/think medium` فما زالت تتجاوز التشغيل النشط.

  </Accordion>

  <Accordion title="Reasoning models">
    يتعامل OpenClaw مع النماذج ذات الأسماء مثل `deepseek-r1` أو `reasoning` أو `think` كنماذج قادرة على الاستدلال افتراضيًا.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    لا يلزم أي إعداد إضافي. يضع OpenClaw عليها العلامة تلقائيًا.

  </Accordion>

  <Accordion title="Model costs">
    Ollama مجاني ويعمل محليًا، لذلك تُضبط كل تكاليف النماذج على $0. ينطبق ذلك على النماذج المكتشفة تلقائيًا والمحددة يدويًا.
  </Accordion>

  <Accordion title="Memory embeddings">
    يسجّل Ollama Plugin المضمّن موفر تضمينات ذاكرة لـ
    [بحث الذاكرة](/ar/concepts/memory). يستخدم عنوان URL الأساسي لـ Ollama
    ومفتاح API المُعدّين، ويستدعي نقطة نهاية Ollama الحالية `/api/embed`، ويجمع
    عدة أجزاء ذاكرة في طلب `input` واحد عندما يكون ذلك ممكنًا.

    | الخاصية | القيمة |
    | ------------- | ------------------- |
    | النموذج الافتراضي | `nomic-embed-text` |
    | السحب التلقائي | نعم — يُسحب نموذج التضمين تلقائيًا إذا لم يكن موجودًا محليًا |

    تستخدم تضمينات وقت الاستعلام بادئات الاسترجاع للنماذج التي تتطلبها أو توصي بها، بما في ذلك `nomic-embed-text` و`qwen3-embedding` و`mxbai-embed-large`. تبقى دفعات مستندات الذاكرة خامًا حتى لا تحتاج الفهارس الموجودة إلى ترحيل تنسيق.

    لاختيار Ollama كموفر تضمينات بحث الذاكرة:

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

    لمضيف تضمين بعيد، أبقِ المصادقة محصورة بذلك المضيف:

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

  <Accordion title="Streaming configuration">
    يستخدم تكامل Ollama في OpenClaw **واجهة Ollama API الأصلية** (`/api/chat`) افتراضيًا، وهي تدعم البث واستدعاء الأدوات معًا بشكل كامل. لا يلزم أي إعداد خاص.

    بالنسبة إلى طلبات `/api/chat` الأصلية، يمرر OpenClaw أيضًا التحكم في التفكير مباشرةً إلى Ollama: يرسل `/think off` و`openclaw agent --thinking off` القيمة العلوية `think: false` ما لم تُضبط قيمة صريحة للنموذج `params.think`/`params.thinking`، بينما يرسل `/think low|medium|high` سلسلة جهد `think` العلوية المطابقة. يتطابق `/think max` مع أعلى جهد أصلي في Ollama، وهو `think: "high"`.

    <Tip>
    إذا كنت بحاجة إلى استخدام نقطة النهاية المتوافقة مع OpenAI، فراجع قسم "الوضع القديم المتوافق مع OpenAI" أعلاه. قد لا يعمل البث واستدعاء الأدوات معًا في ذلك الوضع.
    </Tip>

  </Accordion>
</AccordionGroup>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="WSL2 crash loop (repeated reboots)">
    على WSL2 مع NVIDIA/CUDA، يُنشئ مُثبّت Ollama الرسمي لنظام Linux وحدة systemd باسم `ollama.service` مع `Restart=always`. إذا بدأت هذه الخدمة تلقائيًا وحمّلت نموذجًا مدعومًا بوحدة GPU أثناء إقلاع WSL2، فقد يثبّت Ollama ذاكرة المضيف أثناء تحميل النموذج. لا يستطيع استرداد الذاكرة في Hyper-V دائمًا استعادة تلك الصفحات المثبتة، لذلك قد ينهي Windows جهاز WSL2 الافتراضي، ثم يبدأ systemd تشغيل Ollama مرة أخرى، وتتكرر الحلقة.

    أدلة شائعة:

    - عمليات إعادة تشغيل أو إنهاء متكررة لـ WSL2 من جهة Windows
    - ارتفاع استخدام CPU في `app.slice` أو `ollama.service` بعد وقت قصير من بدء تشغيل WSL2
    - إشارة SIGTERM من systemd بدلًا من حدث قاتل OOM في Linux

    يسجل OpenClaw تحذير بدء تشغيل عندما يكتشف WSL2، وتمكين `ollama.service` مع `Restart=always`، ووجود علامات CUDA مرئية.

    التخفيف:

    ```bash
    sudo systemctl disable ollama
    ```

    أضف هذا إلى `%USERPROFILE%\.wslconfig` على جهة Windows، ثم شغّل `wsl --shutdown`:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    اضبط مدة keep-alive أقصر في بيئة خدمة Ollama، أو ابدأ Ollama يدويًا فقط عندما تحتاج إليه:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    راجع [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317).

  </Accordion>

  <Accordion title="Ollama not detected">
    تأكد من أن Ollama قيد التشغيل وأنك عيّنت `OLLAMA_API_KEY` (أو ملف تعريف مصادقة)، وأنك **لم** تعرّف إدخالًا صريحًا باسم `models.providers.ollama`:

    ```bash
    ollama serve
    ```

    تحقق من إمكانية الوصول إلى API:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="No models available">
    إذا لم يكن نموذجك مدرجًا، فإما أن تسحب النموذج محليًا أو تعرّفه صراحةً في `models.providers.ollama`.

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="Connection refused">
    تحقق من أن Ollama يعمل على المنفذ الصحيح:

    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="Remote host works with curl but not OpenClaw">
    تحقق من الجهاز نفسه وبيئة التشغيل نفسها التي تشغّل Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    الأسباب الشائعة:

    - يشير `baseUrl` إلى `localhost`، لكن Gateway يعمل في Docker أو على مضيف آخر.
    - يستخدم URL المسار `/v1`، ما يختار سلوكًا متوافقًا مع OpenAI بدلًا من Ollama الأصلي.
    - يحتاج المضيف البعيد إلى تغييرات في جدار الحماية أو ربط LAN من جهة Ollama.
    - النموذج موجود على خادم laptop لديك لكنه غير موجود على الخادم البعيد.

  </Accordion>

  <Accordion title="Model outputs tool JSON as text">
    يعني هذا عادةً أن المزوّد يستخدم الوضع المتوافق مع OpenAI أو أن النموذج لا يستطيع التعامل مع مخططات الأدوات.

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

    إذا ظل نموذج محلي صغير يفشل مع مخططات الأدوات، فاضبط `compat.supportsTools: false` على إدخال ذلك النموذج وأعد الاختبار.

  </Accordion>

  <Accordion title="Kimi or GLM returns garbled symbols">
    تُعامل استجابات Kimi/GLM المستضافة التي تكون طويلة وتتكون من سلاسل رموز غير لغوية كمخرجات مزوّد فاشلة بدلًا من إجابة مساعد ناجحة. يتيح ذلك لإعادة المحاولة أو الرجوع الاحتياطي أو معالجة الأخطاء العادية أن تتولى الأمر من دون حفظ النص التالف في الجلسة.

    إذا حدث ذلك مرارًا، فالتقط اسم النموذج الخام، وملف الجلسة الحالي، وما إذا كان التشغيل قد استخدم `Cloud + Local` أو `Cloud only`، ثم جرّب جلسة جديدة ونموذجًا احتياطيًا:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="Cold local model times out">
    قد تحتاج النماذج المحلية الكبيرة إلى تحميل أولي طويل قبل بدء البث. أبقِ المهلة محصورة في مزوّد Ollama، ويمكنك اختياريًا طلب إبقاء النموذج محمّلًا بين الأدوار من Ollama:

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

    إذا كان المضيف نفسه بطيئًا في قبول الاتصالات، فإن `timeoutSeconds` يمدّد أيضًا مهلة اتصال Undici المحمية لهذا المزوّد.

  </Accordion>

  <Accordion title="Large-context model is too slow or runs out of memory">
    تعلن كثير من نماذج Ollama عن سياقات أكبر مما يستطيع عتادك تشغيله براحة. يستخدم Ollama الأصلي الإعداد الافتراضي لسياق وقت التشغيل الخاص بـ Ollama ما لم تضبط `params.num_ctx`. حدّد كلًا من ميزانية OpenClaw وسياق طلب Ollama عندما تريد زمن وصول قابلًا للتنبؤ لأول رمز:

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

    خفّض `contextWindow` أولًا إذا كان OpenClaw يرسل قدرًا كبيرًا جدًا من الموجه. خفّض `params.num_ctx` إذا كان Ollama يحمّل سياق وقت تشغيل أكبر مما يناسب الجهاز. خفّض `maxTokens` إذا استغرق التوليد وقتًا طويلًا جدًا.

  </Accordion>
</AccordionGroup>

<Note>
مزيد من المساعدة: [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) و[الأسئلة الشائعة](/ar/help/faq).
</Note>

## ذات صلة

<CardGroup cols={2}>
  <Card title="Model providers" href="/ar/concepts/model-providers" icon="layers">
    نظرة عامة على جميع المزوّدين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="Model selection" href="/ar/concepts/models" icon="brain">
    كيفية اختيار النماذج وتكوينها.
  </Card>
  <Card title="Ollama Web Search" href="/ar/tools/ollama-search" icon="magnifying-glass">
    تفاصيل الإعداد والسلوك الكاملة للبحث على الويب المدعوم من Ollama.
  </Card>
  <Card title="Configuration" href="/ar/gateway/configuration" icon="gear">
    مرجع التكوين الكامل.
  </Card>
</CardGroup>
