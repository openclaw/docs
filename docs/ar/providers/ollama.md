---
read_when:
    - تريد تشغيل OpenClaw باستخدام نماذج سحابية أو محلية عبر Ollama
    - تحتاج إلى إرشادات لإعداد Ollama وتكوينه
    - تريد نماذج الرؤية من Ollama لفهم الصور
summary: شغّل OpenClaw مع Ollama (النماذج السحابية والمحلية)
title: Ollama
x-i18n:
    generated_at: "2026-07-01T05:45:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e047ee6c0531d1d0231d5ccad00f9af0889039d527cd1247c9b802bc406eadf
    source_path: providers/ollama.md
    workflow: 16
---

يتكامل OpenClaw مع واجهة Ollama البرمجية الأصلية (`/api/chat`) للنماذج السحابية المستضافة وخوادم Ollama المحلية/ذاتية الاستضافة. يمكنك استخدام Ollama بثلاثة أوضاع: `Cloud + Local` عبر مضيف Ollama يمكن الوصول إليه، أو `Cloud only` مقابل `https://ollama.com`، أو `Local only` مقابل مضيف Ollama يمكن الوصول إليه.

يسجل OpenClaw أيضًا `ollama-cloud` كمعرف مزود مستضاف من الدرجة الأولى
لاستخدام Ollama Cloud مباشرة. استخدم مراجع مثل `ollama-cloud/kimi-k2.5:cloud` عندما
تريد توجيهًا سحابيًا فقط دون مشاركة معرف مزود `ollama` المحلي.

لصفحة الإعداد المخصصة للسحابة فقط، راجع [Ollama Cloud](/ar/providers/ollama-cloud).

<Warning>
**مستخدمو Ollama البعيد**: لا تستخدم عنوان URL المتوافق مع OpenAI بصيغة `/v1` (`http://host:11434/v1`) مع OpenClaw. يؤدي ذلك إلى كسر استدعاء الأدوات وقد تُخرج النماذج JSON الأدوات الخام كنص عادي. استخدم عنوان URL لواجهة Ollama البرمجية الأصلية بدلًا من ذلك: `baseUrl: "http://host:11434"` (بدون `/v1`).
</Warning>

يستخدم تكوين مزود Ollama المفتاح `baseUrl` كمفتاح أساسي. يقبل OpenClaw أيضًا `baseURL` للتوافق مع أمثلة نمط OpenAI SDK، لكن ينبغي أن تفضل التكوينات الجديدة `baseUrl`.

## قواعد المصادقة

<AccordionGroup>
  <Accordion title="المضيفون المحليون ومضيفو LAN">
    لا تحتاج مضيفات Ollama المحلية ومضيفات LAN إلى رمز bearer حقيقي. يستخدم OpenClaw العلامة المحلية `ollama-local` فقط لعناوين URL الأساسية لـ Ollama الخاصة بـ local loopback، والشبكات الخاصة، و`.local`، وأسماء المضيفين المجردة.
  </Accordion>
  <Accordion title="المضيفون البعيدون ومضيفو Ollama Cloud">
    تتطلب المضيفات العامة البعيدة وOllama Cloud (`https://ollama.com`) بيانات اعتماد حقيقية عبر `OLLAMA_API_KEY`، أو ملف تعريف مصادقة، أو `apiKey` الخاص بالمزود. للاستخدام المستضاف المباشر، فضّل المزود `ollama-cloud`.
  </Accordion>
  <Accordion title="معرفات المزود المخصصة">
    تتبع معرفات المزود المخصصة التي تضبط `api: "ollama"` القواعد نفسها. على سبيل المثال، يمكن لمزود `ollama-remote` يشير إلى مضيف Ollama على LAN خاص أن يستخدم `apiKey: "ollama-local"` وستحل الوكلاء الفرعيون تلك العلامة عبر خطاف مزود Ollama بدلًا من التعامل معها كبيانات اعتماد مفقودة. يمكن لبحث الذاكرة أيضًا ضبط `agents.defaults.memorySearch.provider` على معرف ذلك المزود المخصص بحيث تستخدم التضمينات نقطة نهاية Ollama المطابقة.
  </Accordion>
  <Accordion title="ملفات تعريف المصادقة">
    يخزن `auth-profiles.json` بيانات الاعتماد لمعرف مزود. ضع إعدادات نقطة النهاية (`baseUrl`، و`api`، ومعرفات النماذج، والرؤوس، والمهلات) في `models.providers.<id>`. ملفات تعريف المصادقة المسطحة الأقدم مثل `{ "ollama-windows": { "apiKey": "ollama-local" } }` ليست تنسيق تشغيل؛ شغّل `openclaw doctor --fix` لإعادة كتابتها إلى ملف تعريف مفتاح API الأساسي `ollama-windows:default` مع نسخة احتياطية. وجود `baseUrl` في ذلك الملف ضجيج توافق وينبغي نقله إلى تكوين المزود.
  </Accordion>
  <Accordion title="نطاق تضمين الذاكرة">
    عند استخدام Ollama لتضمينات الذاكرة، تكون مصادقة bearer مقصورة على المضيف الذي أُعلنت فيه:

    - لا يُرسل مفتاح على مستوى المزود إلا إلى مضيف Ollama الخاص بذلك المزود.
    - لا يُرسل `agents.*.memorySearch.remote.apiKey` إلا إلى مضيف التضمين البعيد الخاص به.
    - تُعامل قيمة env الخالصة `OLLAMA_API_KEY` كاصطلاح Ollama Cloud، ولا تُرسل افتراضيًا إلى المضيفين المحليين أو ذاتيي الاستضافة.

  </Accordion>
</AccordionGroup>

## البدء

اختر طريقة الإعداد والوضع المفضلين لديك.

<Tabs>
  <Tab title="الإعداد الأولي (موصى به)">
    **الأفضل لـ:** أسرع مسار إلى إعداد Ollama سحابي أو محلي يعمل.

    <Steps>
      <Step title="تشغيل الإعداد الأولي">
        ```bash
        openclaw onboard
        ```

        اختر **Ollama** من قائمة المزودين.
      </Step>
      <Step title="اختر وضعك">
        - **Cloud + Local** — مضيف Ollama محلي بالإضافة إلى نماذج سحابية موجهة عبر ذلك المضيف
        - **Cloud only** — نماذج Ollama مستضافة عبر `https://ollama.com`
        - **Local only** — نماذج محلية فقط

      </Step>
      <Step title="اختر نموذجًا">
        يطلب `Cloud only` قيمة `OLLAMA_API_KEY` ويقترح افتراضيات سحابية مستضافة. يطلب `Cloud + Local` و`Local only` عنوان URL أساسيًا لـ Ollama، ويكتشفان النماذج المتاحة، ويسحبان النموذج المحلي المختار تلقائيًا إذا لم يكن متاحًا بعد. عندما يبلّغ Ollama عن وسم `:latest` مثبت مثل `gemma4:latest`، يعرض الإعداد ذلك النموذج المثبت مرة واحدة بدلًا من عرض كل من `gemma4` و`gemma4:latest` أو سحب الاسم المستعار المجرد مرة أخرى. يتحقق `Cloud + Local` أيضًا مما إذا كان مضيف Ollama هذا مسجل الدخول للوصول السحابي.
      </Step>
      <Step title="تحقق من أن النموذج متاح">
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

    يمكنك اختياريًا تحديد عنوان URL أساسي مخصص أو نموذج مخصص:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="الإعداد اليدوي">
    **الأفضل لـ:** التحكم الكامل في الإعداد السحابي أو المحلي.

    <Steps>
      <Step title="اختر السحابة أو المحلي">
        - **Cloud + Local**: ثبّت Ollama، وسجّل الدخول باستخدام `ollama signin`، ووجّه الطلبات السحابية عبر ذلك المضيف
        - **Cloud only**: استخدم `https://ollama.com` مع `OLLAMA_API_KEY`
        - **Local only**: ثبّت Ollama من [ollama.com/download](https://ollama.com/download)

      </Step>
      <Step title="اسحب نموذجًا محليًا (محلي فقط)">
        ```bash
        ollama pull gemma4
        # or
        ollama pull gpt-oss:20b
        # or
        ollama pull llama3.3
        ```
      </Step>
      <Step title="فعّل Ollama لـ OpenClaw">
        بالنسبة إلى `Cloud only`، استخدم `OLLAMA_API_KEY` الحقيقي الخاص بك. بالنسبة إلى الإعدادات المدعومة بمضيف، تعمل أي قيمة عنصر نائب:

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # Or configure in your config file
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="افحص نموذجك واضبطه">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        أو اضبط الافتراضي في التكوين:

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
    يستخدم `Cloud + Local` مضيف Ollama يمكن الوصول إليه كنقطة تحكم لكل من النماذج المحلية والسحابية. هذا هو التدفق الهجين المفضل لدى Ollama.

    استخدم **Cloud + Local** أثناء الإعداد. يطلب OpenClaw عنوان URL الأساسي لـ Ollama، ويكتشف النماذج المحلية من ذلك المضيف، ويتحقق مما إذا كان المضيف مسجل الدخول للوصول السحابي باستخدام `ollama signin`. عندما يكون المضيف مسجل الدخول، يقترح OpenClaw أيضًا افتراضيات سحابية مستضافة مثل `kimi-k2.5:cloud`، و`minimax-m2.7:cloud`، و`glm-5.1:cloud`.

    إذا لم يكن المضيف مسجل الدخول بعد، يُبقي OpenClaw الإعداد محليًا فقط حتى تشغّل `ollama signin`.

  </Tab>

  <Tab title="Cloud only">
    يعمل `Cloud only` مقابل واجهة Ollama المستضافة عند `https://ollama.com`.

    استخدم **Cloud only** أثناء الإعداد. يطلب OpenClaw قيمة `OLLAMA_API_KEY`، ويضبط `baseUrl: "https://ollama.com"`، ويملأ قائمة النماذج السحابية المستضافة. لا يتطلب هذا المسار خادم Ollama محليًا أو `ollama signin`.

    تُملأ قائمة النماذج السحابية المعروضة أثناء `openclaw onboard` مباشرة من `https://ollama.com/api/tags`، وبحد أقصى 500 إدخال، لذلك تعكس أداة الاختيار الفهرس المستضاف الحالي بدلًا من بذرة ثابتة. إذا تعذر الوصول إلى `ollama.com` أو لم يُرجع أي نماذج وقت الإعداد، يعود OpenClaw إلى الاقتراحات السابقة المرمزة ثابتًا حتى يكتمل الإعداد الأولي.

    يمكنك أيضًا تكوين مزود السحابة من الدرجة الأولى مباشرة:

    ```bash
    openclaw onboard --auth-choice ollama-cloud
    openclaw models set ollama-cloud/kimi-k2.5:cloud
    ```

  </Tab>

  <Tab title="Local only">
    في وضع المحلي فقط، يكتشف OpenClaw النماذج من مثيل Ollama المكوّن. هذا المسار مخصص لخوادم Ollama المحلية أو ذاتية الاستضافة.

    يقترح OpenClaw حاليًا `gemma4` كافتراضي محلي.

  </Tab>
</Tabs>

## اكتشاف النموذج (مزود ضمني)

عندما تضبط `OLLAMA_API_KEY` (أو ملف تعريف مصادقة) و**لا** تعرّف `models.providers.ollama` أو مزودًا بعيدًا مخصصًا آخر مع `api: "ollama"`، يكتشف OpenClaw النماذج من مثيل Ollama المحلي عند `http://127.0.0.1:11434`.

| السلوك              | التفاصيل                                                                                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| استعلام الفهرس       | يستعلم `/api/tags`                                                                                                                                                   |
| اكتشاف الإمكانات     | يستخدم عمليات بحث `/api/show` بأفضل جهد لقراءة `contextWindow`، ومعلمات Modelfile الموسعة `num_ctx`، والإمكانات بما في ذلك الرؤية/الأدوات                         |
| نماذج الرؤية         | تُعلّم النماذج التي لديها إمكانية `vision` مبلغ عنها بواسطة `/api/show` كقادرة على الصور (`input: ["text", "image"]`)، لذلك يحقن OpenClaw الصور تلقائيًا في الموجّه |
| اكتشاف الاستدلال     | يستخدم إمكانات `/api/show` عند توفرها، بما في ذلك `thinking`؛ ويعود إلى استدلال من اسم النموذج (`r1`، و`reasoning`، و`think`) عندما يحذف Ollama الإمكانات          |
| حدود الرموز          | يضبط `maxTokens` على الحد الأقصى الافتراضي لرموز Ollama الذي يستخدمه OpenClaw                                                                                       |
| التكاليف             | يضبط جميع التكاليف على `0`                                                                                                                                           |

يتجنب هذا إدخالات النماذج اليدوية مع إبقاء الفهرس متماشيًا مع مثيل Ollama المحلي. يمكنك استخدام مرجع كامل مثل `ollama/<pulled-model>:latest` في `infer model run` المحلي؛ يحل OpenClaw ذلك النموذج المثبت من فهرس Ollama الحي دون الحاجة إلى إدخال مكتوب يدويًا في `models.json`.

بالنسبة إلى مضيفات Ollama المسجلة الدخول، قد تكون بعض نماذج `:cloud` قابلة للاستخدام عبر `/api/chat`
و`/api/show` قبل ظهورها في `/api/tags`. عندما تختار صراحة مرجعًا
كاملًا بصيغة `ollama/<model>:cloud`، يتحقق OpenClaw من ذلك النموذج المفقود بدقة باستخدام
`/api/show` ويضيفه إلى فهرس التشغيل فقط إذا أكد Ollama بيانات تعريف النموذج.
ما تزال الأخطاء المطبعية تفشل كنماذج غير معروفة بدلًا من إنشائها تلقائيًا.

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

ما يزال ذلك المسار يستخدم مزود OpenClaw المكوّن، والمصادقة، ونقل Ollama
الأصلي، لكنه لا يبدأ دورة وكيل دردشة ولا يحمّل سياق MCP/الأدوات. إذا
نجح هذا بينما تفشل ردود الوكيل العادية، فاستكشف بعد ذلك سعة موجّه/أدوات
الوكيل الخاصة بالنموذج.

لاختبار smoke ضيق لنموذج رؤية على المسار الخفيف نفسه، أضف ملف صورة واحدًا أو أكثر
إلى `infer model run`. يرسل هذا الموجّه والصورة مباشرة إلى
نموذج رؤية Ollama المحدد دون تحميل أدوات الدردشة، أو الذاكرة، أو سياق
الجلسة السابق:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

يقبل `model run --file` الملفات المكتشفة كـ `image/*`، بما في ذلك مدخلات PNG و
JPEG و WebP الشائعة. تُرفض الملفات غير الصورية قبل استدعاء Ollama.
للتعرّف على الكلام، استخدم `openclaw infer audio transcribe` بدلاً من ذلك.

عند تبديل محادثة باستخدام `/model ollama/<model>`، يتعامل OpenClaw
مع ذلك كاختيار مستخدم دقيق. إذا تعذّر الوصول إلى `baseUrl` الخاص بـ Ollama
المكوّن، يفشل الرد التالي بخطأ المزوّد بدلاً من الإجابة بصمت
من نموذج احتياطي آخر مكوّن.

تجري مهام Cron المعزولة فحص أمان محلياً إضافياً واحداً قبل أن تبدأ دورة الوكيل.
إذا كان النموذج المحدد يُحل إلى مزوّد Ollama محلي أو على شبكة خاصة أو `.local`
وكان `/api/tags` غير قابل للوصول، يسجل OpenClaw تشغيل Cron هذا
كـ `skipped` مع `ollama/<model>` المحدد في نص الخطأ. يُخزّن فحص
نقطة النهاية المسبق مؤقتاً لمدة 5 دقائق، لذلك لا تطلق عدة مهام Cron موجهة
إلى خادم Ollama المتوقف نفسه طلبات نماذج فاشلة كلها.

تحقّق حياً من مسار النص المحلي، ومسار البث الأصلي، والتضمينات مقابل
Ollama المحلي باستخدام:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

لاختبارات smoke لمفتاح API في Ollama Cloud، وجّه الاختبار الحي إلى `https://ollama.com`
واختر نموذجاً مستضافاً من الفهرس الحالي:

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

يشغّل اختبار smoke السحابي النص والبث الأصلي وبحث الويب. ويتخطى التضمينات
افتراضياً لـ `https://ollama.com` لأن مفاتيح API في Ollama Cloud قد لا تخوّل
`/api/embed`. اضبط `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` عندما تريد صراحةً
أن يفشل الاختبار الحي إذا لم يستطع المفتاح السحابي المكوّن استخدام نقطة نهاية التضمين.

لإضافة نموذج جديد، اسحبه ببساطة باستخدام Ollama:

```bash
ollama pull mistral
```

سيُكتشف النموذج الجديد تلقائياً ويصبح متاحاً للاستخدام.

<Note>
إذا عيّنت `models.providers.ollama` صراحةً، أو كوّنت مزوّداً بعيداً مخصصاً مثل `models.providers.ollama-cloud` مع `api: "ollama"`، فسيُتخطى الاكتشاف التلقائي ويجب عليك تعريف النماذج يدوياً. لا يزال مزوّدو loopback المخصصون مثل `http://127.0.0.2:11434` يُعاملون كمحليين. راجع قسم التكوين الصريح أدناه.
</Note>

## الرؤية ووصف الصور

يسجّل Plugin Ollama المضمّن Ollama كمزوّد فهم وسائط قادر على الصور. يتيح هذا لـ OpenClaw توجيه طلبات وصف الصور الصريحة وافتراضيات نماذج الصور المكوّنة عبر نماذج رؤية Ollama المحلية أو المستضافة.

للرؤية المحلية، اسحب نموذجاً يدعم الصور:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

ثم تحقّق باستخدام infer CLI:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

يجب أن يكون `--model` مرجع `<provider/model>` كاملاً. عند ضبطه، يحاول `openclaw infer image describe` ذلك النموذج أولاً بدلاً من تخطي الوصف لأن النموذج يدعم الرؤية الأصلية. إذا فشل استدعاء النموذج، يمكن لـ OpenClaw المتابعة عبر `agents.defaults.imageModel.fallbacks` المكوّنة؛ أما أخطاء تحضير الملف أو URL فتظل تفشل قبل محاولات النماذج الاحتياطية.

استخدم `infer image describe` عندما تريد مسار مزوّد فهم الصور في OpenClaw، و`agents.defaults.imageModel` المكوّن، وشكل مخرجات وصف الصور. استخدم `infer model run --file` عندما تريد فحص نموذج خام متعدد الوسائط بمطالبة مخصصة وصورة واحدة أو أكثر.

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

فضّل مرجع `ollama/<model>` الكامل. إذا كان النموذج نفسه مدرجاً ضمن `models.providers.ollama.models` مع `input: ["text", "image"]` ولا يكشف أي مزوّد صور مكوّن آخر معرّف النموذج المجرد نفسه، فإن OpenClaw يطبّع أيضاً مرجع `imageModel` مجرداً مثل `qwen2.5vl:7b` إلى `ollama/qwen2.5vl:7b`. إذا كان لدى أكثر من مزوّد صور مكوّن المعرّف المجرد نفسه، فاستخدم بادئة المزوّد صراحةً.

قد تحتاج نماذج الرؤية المحلية البطيئة إلى مهلة أطول لفهم الصور من النماذج السحابية. ويمكنها أيضاً أن تتعطل أو تتوقف عندما يحاول Ollama تخصيص سياق الرؤية الكامل المعلن على عتاد محدود. اضبط مهلة قدرة، وحدد سقف `num_ctx` في إدخال النموذج عندما لا تحتاج إلا إلى دورة وصف صورة عادية:

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

تنطبق هذه المهلة على فهم الصور الواردة وعلى أداة `image` الصريحة التي يمكن للوكيل استدعاؤها أثناء دورة. لا يزال `models.providers.ollama.timeoutSeconds` على مستوى المزوّد يتحكم في حارس طلب HTTP الأساسي إلى Ollama لاستدعاءات النماذج العادية.

تحقّق حياً من أداة الصور الصريحة مقابل Ollama المحلي باستخدام:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

إذا عرّفت `models.providers.ollama.models` يدوياً، فضع علامة على نماذج الرؤية التي تدعم إدخال الصور:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

يرفض OpenClaw طلبات وصف الصور للنماذج غير الموسومة بأنها قادرة على الصور. مع الاكتشاف الضمني، يقرأ OpenClaw هذا من Ollama عندما يُبلغ `/api/show` عن قدرة رؤية.

## التكوين

<Tabs>
  <Tab title="Basic (implicit discovery)">
    أبسط مسار تفعيل محلي فقط يكون عبر متغير بيئة:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    إذا كان `OLLAMA_API_KEY` مضبوطاً، يمكنك حذف `apiKey` في إدخال المزوّد وسيملؤه OpenClaw لفحوصات التوفر.
    </Tip>

  </Tab>

  <Tab title="Explicit (manual models)">
    استخدم التكوين الصريح عندما تريد إعداداً سحابياً مستضافاً، أو يعمل Ollama على مضيف/منفذ آخر، أو تريد فرض نوافذ سياق أو قوائم نماذج محددة، أو تريد تعريفات نماذج يدوية بالكامل.

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
    إذا كان Ollama يعمل على مضيف أو منفذ مختلف (التكوين الصريح يعطّل الاكتشاف التلقائي، لذا عرّف النماذج يدوياً):

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
    لا تضف `/v1` إلى URL. يستخدم مسار `/v1` وضعاً متوافقاً مع OpenAI، حيث لا يكون استدعاء الأدوات موثوقاً. استخدم URL الأساسي لـ Ollama دون لاحقة مسار.
    </Warning>

  </Tab>
</Tabs>

## وصفات شائعة

استخدم هذه كنقاط بداية واستبدل معرّفات النماذج بالأسماء الدقيقة من `ollama list` أو `openclaw models list --provider ollama`.

<AccordionGroup>
  <Accordion title="Local model with auto-discovery">
    استخدم هذا عندما يعمل Ollama على الجهاز نفسه مثل Gateway وتريد أن يكتشف OpenClaw النماذج المثبتة تلقائياً.

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    يحافظ هذا المسار على الحد الأدنى من التكوين. لا تضف كتلة `models.providers.ollama` إلا إذا كنت تريد تعريف النماذج يدوياً.

  </Accordion>

  <Accordion title="LAN Ollama host with manual models">
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

    `contextWindow` هو ميزانية السياق من جانب OpenClaw. يُرسل `params.num_ctx` إلى Ollama للطلب. أبقهما متوافقين عندما لا يستطيع عتادك تشغيل السياق الكامل المعلن للنموذج.

  </Accordion>

  <Accordion title="Ollama Cloud only">
    استخدم هذا عندما لا تشغّل خادماً محلياً وتريد نماذج Ollama المستضافة مباشرةً.

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

  <Accordion title="Cloud plus local through a signed-in daemon">
    استخدم هذا عندما يكون خادم Ollama محلي أو على LAN مسجل الدخول باستخدام `ollama signin` ويجب أن يخدم كلاً من النماذج المحلية ونماذج `:cloud`.

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

  <Accordion title="مضيفو Ollama المتعددون">
    استخدم معرّفات موفّرين مخصصة عندما يكون لديك أكثر من خادم Ollama واحد. يحصل كل موفّر على المضيف والنماذج والمصادقة والمهلة ومراجع النماذج الخاصة به.

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

    عندما يرسل OpenClaw الطلب، تُزال بادئة الموفّر النشط بحيث يصل `ollama-large/qwen3.5:27b` إلى Ollama باسم `qwen3.5:27b`.

  </Accordion>

  <Accordion title="ملف تعريف نموذج محلي خفيف">
    يمكن لبعض النماذج المحلية الإجابة عن المطالبات البسيطة لكنها تواجه صعوبة مع سطح أدوات الوكيل الكامل. ابدأ بتقييد الأدوات والسياق قبل تغيير إعدادات وقت التشغيل العامة.

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

    استخدم `compat.supportsTools: false` فقط عندما يفشل النموذج أو الخادم بشكل موثوق مع مخططات الأدوات. هذا يبادل قدرة الوكيل بالاستقرار.
    يزيل `localModelLean` أدوات المتصفح وCron والرسائل من سطح الوكيل المباشر، ويضع الكتالوجات الأكبر افتراضيًا خلف عناصر تحكم Tool Search مهيكلة إلا عندما يجب أن يحافظ التشغيل على دلالات تسليم الرسائل المباشر، لكنه لا يغيّر سياق وقت تشغيل Ollama أو وضع التفكير. اقرنه بـ `params.num_ctx` صريح و`params.thinking: false` لنماذج التفكير الصغيرة على نمط Qwen التي تدخل في حلقات أو تنفق ميزانية استجابتها على الاستدلال المخفي.

  </Accordion>
</AccordionGroup>

### اختيار النموذج

بعد التهيئة، تصبح كل نماذج Ollama لديك متاحة:

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

تُدعم أيضًا معرّفات موفّري Ollama المخصصة. عندما يستخدم مرجع نموذج بادئة
الموفّر النشط، مثل `ollama-spark/qwen3:32b`، يزيل OpenClaw تلك
البادئة فقط قبل استدعاء Ollama بحيث يتلقى الخادم `qwen3:32b`.

للنماذج المحلية البطيئة، فضّل ضبط الطلب ضمن نطاق الموفّر قبل زيادة مهلة
وقت تشغيل الوكيل بالكامل:

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

ينطبق `timeoutSeconds` على طلب HTTP الخاص بالنموذج، بما في ذلك إعداد الاتصال،
والترويسات، وبث الجسم، وإلغاء الجلب المحروس الإجمالي. يُمرّر `params.keep_alive`
إلى Ollama كـ `keep_alive` على المستوى الأعلى في طلبات `/api/chat` الأصلية؛
اضبطه لكل نموذج عندما يكون وقت تحميل الدور الأول هو عنق الزجاجة.

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

## بحث ويب Ollama

يدعم OpenClaw **بحث ويب Ollama** كموفّر `web_search` مضمّن.

| الخاصية    | التفاصيل                                                                                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| المضيف        | يستخدم مضيف Ollama المهيأ لديك (`models.providers.ollama.baseUrl` عند ضبطه، وإلا `http://127.0.0.1:11434`)؛ يستخدم `https://ollama.com` واجهة API المستضافة مباشرة |
| المصادقة        | بلا مفتاح لمضيفي Ollama المحليين المسجّل دخولهم؛ `OLLAMA_API_KEY` أو مصادقة الموفّر المهيأة للبحث المباشر عبر `https://ollama.com` أو المضيفين المحميين بالمصادقة               |
| المتطلب | يجب أن تكون المضيفات المحلية/ذاتية الاستضافة قيد التشغيل ومسجّلًا دخولها عبر `ollama signin`؛ يتطلب البحث المستضاف المباشر `baseUrl: "https://ollama.com"` بالإضافة إلى مفتاح Ollama API حقيقي |

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

بالنسبة إلى daemon محلي مسجّل الدخول، يستخدم OpenClaw وكيل `/api/experimental/web_search` الخاص بالـ daemon. أما بالنسبة إلى `https://ollama.com`، فيستدعي نقطة نهاية `/api/web_search` المستضافة مباشرة.

<Note>
للاطلاع على تفاصيل الإعداد والسلوك الكاملة، راجع [بحث ويب Ollama](/ar/tools/ollama-search).
</Note>

## التهيئة المتقدمة

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

    قد لا يدعم هذا الوضع البث واستدعاء الأدوات في الوقت نفسه. قد تحتاج إلى تعطيل البث باستخدام `params: { streaming: false }` في تهيئة النموذج.

    عند استخدام `api: "openai-completions"` مع Ollama، يحقن OpenClaw `options.num_ctx` افتراضيًا حتى لا يعود Ollama بصمت إلى نافذة سياق 4096. إذا كان الوكيل/المصدر الأعلى يرفض حقول `options` غير المعروفة، فعطّل هذا السلوك:

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
    بالنسبة إلى النماذج المكتشفة تلقائيًا، يستخدم OpenClaw نافذة السياق التي يبلّغ عنها Ollama عندما تكون متاحة، بما في ذلك قيم `PARAMETER num_ctx` الأكبر من Modelfiles المخصصة. وإلا فإنه يعود إلى نافذة سياق Ollama الافتراضية التي يستخدمها OpenClaw.

    يمكنك ضبط القيم الافتراضية `contextWindow` و`contextTokens` و`maxTokens` على مستوى الموفّر لكل نموذج تحت موفّر Ollama ذلك، ثم تجاوزها لكل نموذج عند الحاجة. `contextWindow` هي ميزانية المطالبة وCompaction في OpenClaw. تترك طلبات Ollama الأصلية `options.num_ctx` غير مضبوطة إلا إذا هيأت `params.num_ctx` صراحة، بحيث يمكن لـ Ollama تطبيق إعداد النموذج الخاص به، أو `OLLAMA_CONTEXT_LENGTH`، أو الافتراضي القائم على VRAM. لتحديد سقف أو فرض سياق وقت تشغيل Ollama لكل طلب دون إعادة بناء Modelfile، اضبط `params.num_ctx`؛ تُتجاهل القيم غير الصالحة والصفرية والسالبة وغير المنتهية. إذا قمت بترقية تهيئة أقدم كانت تستخدم `contextWindow` أو `maxTokens` فقط لفرض سياق طلب Ollama أصلي، فشغّل `openclaw doctor --fix` لنسخ ميزانيات الموفّر أو النموذج الصريحة تلك إلى `params.num_ctx`. لا يزال محوّل Ollama المتوافق مع OpenAI يحقن `options.num_ctx` افتراضيًا من `params.num_ctx` أو `contextWindow` المهيأ؛ عطّل ذلك باستخدام `injectNumCtxForOpenAICompat: false` إذا كان المصدر الأعلى يرفض `options`.

    تقبل إدخالات نموذج Ollama الأصلية أيضًا خيارات وقت تشغيل Ollama الشائعة تحت `params`، بما في ذلك `temperature` و`top_p` و`top_k` و`min_p` و`num_predict` و`stop` و`repeat_penalty` و`num_batch` و`num_thread` و`use_mmap`. يمرّر OpenClaw مفاتيح طلب Ollama فقط، لذلك لا تتسرب معاملات وقت تشغيل OpenClaw مثل `streaming` إلى Ollama. استخدم `params.think` أو `params.thinking` لإرسال `think` الخاص بـ Ollama على المستوى الأعلى؛ تعطل `false` التفكير على مستوى API لنماذج التفكير على نمط Qwen.

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

    يعمل أيضًا `agents.defaults.models["ollama/<model>"].params.num_ctx` لكل نموذج. إذا تم تكوين الاثنين، يفوز إدخال نموذج الموفّر الصريح على الإعداد الافتراضي للوكيل.

  </Accordion>

  <Accordion title="التحكم في التفكير">
    بالنسبة إلى نماذج Ollama الأصلية، يمرّر OpenClaw التحكم في التفكير كما يتوقعه Ollama: `think` على المستوى الأعلى، وليس `options.think`. تعرض النماذج المكتشفة تلقائيًا التي يتضمن رد `/api/show` الخاص بها قدرة `thinking` الأوامر `/think low` و`/think medium` و`/think high` و`/think max`؛ أما النماذج غير المفكرة فلا تعرض إلا `/think off`.

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

    يمكن لـ `params.think` أو `params.thinking` لكل نموذج تعطيل أو فرض تفكير Ollama API لنموذج مهيأ محدد. يحافظ OpenClaw على معاملات النموذج الصريحة تلك عندما لا يحتوي التشغيل النشط إلا على الإعداد الافتراضي الضمني `off`؛ ولا تزال أوامر وقت التشغيل غير `off` مثل `/think medium` تتجاوز التشغيل النشط.

  </Accordion>

  <Accordion title="نماذج الاستدلال">
    يتعامل OpenClaw مع النماذج ذات الأسماء مثل `deepseek-r1` أو `reasoning` أو `think` بوصفها قادرة على الاستدلال افتراضيًا.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    لا حاجة إلى تهيئة إضافية. يضع OpenClaw عليها علامة تلقائيًا.

  </Accordion>

  <Accordion title="تكاليف النماذج">
    Ollama مجاني ويعمل محليا، لذلك تُضبط جميع تكاليف النماذج على $0. ينطبق هذا على النماذج المكتشفة تلقائيا والمحددة يدويا.
  </Accordion>

  <Accordion title="تضمينات الذاكرة">
    يسجل Plugin Ollama المضمن مزود تضمين ذاكرة من أجل
    [بحث الذاكرة](/ar/concepts/memory). يستخدم عنوان URL الأساسي ومفتاح API المهيأين لـ Ollama، ويستدعي نقطة نهاية Ollama الحالية `/api/embed`، ويجمع
    عدة مقاطع ذاكرة في طلب `input` واحد عندما يكون ذلك ممكنا.

    عندما يكون `proxy.enabled=true`، تستخدم طلبات تضمين ذاكرة Ollama إلى أصل
    host-local loopback الدقيق المشتق من `baseUrl` المهيأ
    المسار المباشر المحروس في OpenClaw بدلا من الوكيل المُدار لإعادة التوجيه. يجب أن يكون اسم المضيف المهيأ نفسه `localhost` أو قيمة حرفية لعنوان IP ارتدادي؛
    أما أسماء DNS التي تتحلل فقط إلى ارتداد فتظل تستخدم مسار الوكيل المُدار.
    كما تظل مضيفات Ollama على LAN وtailnet والشبكة الخاصة والعامة على
    مسار الوكيل المُدار. لا ترث عمليات إعادة التوجيه إلى مضيف أو منفذ آخر الثقة.
    لا يزال بإمكان المشغلين ضبط إعداد `proxy.loopbackMode: "proxy"` العام
    لإرسال حركة مرور loopback عبر الوكيل، أو `proxy.loopbackMode: "block"`
    لرفض اتصالات loopback قبل فتح اتصال؛ راجع
    [الوكيل المُدار](/ar/security/network-proxy#gateway-loopback-mode) للاطلاع على
    تأثير هذا الإعداد على مستوى العملية كلها.

    | الخاصية      | القيمة               |
    | ------------- | ------------------- |
    | النموذج الافتراضي | `nomic-embed-text`  |
    | السحب التلقائي     | نعم — يُسحب نموذج التضمين تلقائيا إذا لم يكن موجودا محليا |

    تستخدم تضمينات وقت الاستعلام بادئات الاسترجاع للنماذج التي تتطلبها أو توصي بها، بما في ذلك `nomic-embed-text` و`qwen3-embedding` و`mxbai-embed-large`. تبقى دفعات مستندات الذاكرة خاما حتى لا تحتاج الفهارس الحالية إلى ترحيل في التنسيق.

    لاختيار Ollama كمزود تضمين بحث الذاكرة:

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

    لمضيف تضمين بعيد، أبق المصادقة مقصورة على ذلك المضيف:

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
    يستخدم تكامل Ollama في OpenClaw **واجهة API الأصلية لـ Ollama** (`/api/chat`) افتراضيا، وهي تدعم البث واستدعاء الأدوات في الوقت نفسه بالكامل. لا يلزم أي إعداد خاص.

    بالنسبة إلى طلبات `/api/chat` الأصلية، يمرر OpenClaw أيضا التحكم في التفكير مباشرة إلى Ollama: ترسل `/think off` و`openclaw agent --thinking off` القيمة `think: false` في المستوى الأعلى ما لم تكن قيمة `params.think`/`params.thinking` صريحة للنموذج مهيأة، بينما ترسل `/think low|medium|high` سلسلة جهد `think` المطابقة في المستوى الأعلى. يُطابق `/think max` أعلى جهد أصلي في Ollama، وهو `think: "high"`.

    <Tip>
    إذا كنت بحاجة إلى استخدام نقطة النهاية المتوافقة مع OpenAI، فراجع قسم "الوضع القديم المتوافق مع OpenAI" أعلاه. قد لا يعمل البث واستدعاء الأدوات في الوقت نفسه في ذلك الوضع.
    </Tip>

  </Accordion>
</AccordionGroup>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="حلقة تعطل WSL2 (إعادات تشغيل متكررة)">
    على WSL2 مع NVIDIA/CUDA، ينشئ مثبت Ollama الرسمي لـ Linux وحدة systemd باسم `ollama.service` مع `Restart=always`. إذا بدأت تلك الخدمة تلقائيا وحملت نموذجا مدعوما بوحدة GPU أثناء إقلاع WSL2، فقد يثبت Ollama ذاكرة المضيف أثناء تحميل النموذج. لا يستطيع استرداد ذاكرة Hyper-V دائما استرداد تلك الصفحات المثبتة، لذلك قد ينهي Windows جهاز WSL2 الافتراضي، ثم يبدأ systemd تشغيل Ollama مرة أخرى، وتتكرر الحلقة.

    الأدلة الشائعة:

    - عمليات إعادة تشغيل أو إنهاء متكررة لـ WSL2 من جهة Windows
    - استخدام CPU مرتفع في `app.slice` أو `ollama.service` بعد وقت قصير من بدء WSL2
    - SIGTERM من systemd بدلا من حدث Linux OOM-killer

    يسجل OpenClaw تحذير بدء تشغيل عندما يكتشف WSL2، و`ollama.service` مفعلة مع `Restart=always`، وعلامات CUDA مرئية.

    التخفيف:

    ```bash
    sudo systemctl disable ollama
    ```

    أضف هذا إلى `%USERPROFILE%\.wslconfig` على جهة Windows، ثم شغل `wsl --shutdown`:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    اضبط مدة احتفاظ أقصر في بيئة خدمة Ollama، أو ابدأ Ollama يدويا فقط عندما تحتاج إليه:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    راجع [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317).

  </Accordion>

  <Accordion title="لم يُكتشف Ollama">
    تأكد من أن Ollama قيد التشغيل وأنك ضبطت `OLLAMA_API_KEY` (أو ملف مصادقة)، وأنك **لم** تعرف إدخالا صريحا لـ `models.providers.ollama`:

    ```bash
    ollama serve
    ```

    تحقق من إمكانية الوصول إلى API:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="لا توجد نماذج متاحة">
    إذا لم يكن نموذجك مدرجا، فإما أن تسحب النموذج محليا أو تعرفه صراحة في `models.providers.ollama`.

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="رُفض الاتصال">
    تحقق من أن Ollama يعمل على المنفذ الصحيح:

    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="المضيف البعيد يعمل مع curl لكن لا يعمل مع OpenClaw">
    تحقق من الجهاز وبيئة التشغيل نفسيهما اللذين يشغلان Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    الأسباب الشائعة:

    - يشير `baseUrl` إلى `localhost`، لكن Gateway يعمل في Docker أو على مضيف آخر.
    - يستخدم عنوان URL المسار `/v1`، ما يختار السلوك المتوافق مع OpenAI بدلا من Ollama الأصلي.
    - يحتاج المضيف البعيد إلى تغييرات في جدار الحماية أو ربط LAN على جهة Ollama.
    - النموذج موجود في خدمة daemon على حاسوبك المحمول لكنه غير موجود في خدمة daemon البعيدة.

  </Accordion>

  <Accordion title="يخرج النموذج JSON الأداة كنص">
    يعني هذا عادة أن المزود يستخدم الوضع المتوافق مع OpenAI أو أن النموذج لا يستطيع التعامل مع مخططات الأدوات.

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

    إذا استمر فشل نموذج محلي صغير مع مخططات الأدوات، فاضبط `compat.supportsTools: false` على إدخال ذلك النموذج وأعد الاختبار.

  </Accordion>

  <Accordion title="يرجع Kimi أو GLM رموزا مشوشة">
    تُعامل استجابات Kimi/GLM المستضافة التي تكون طويلة وغير لغوية ومكونة من تتابعات رموز على أنها إخراج مزود فاشل بدلا من إجابة مساعد ناجحة. يتيح ذلك لإعادة المحاولة أو الرجوع الاحتياطي أو معالجة الأخطاء العادية أن تتولى الأمر من دون حفظ النص التالف في الجلسة.

    إذا حدث ذلك بشكل متكرر، فالتقط اسم النموذج الخام وملف الجلسة الحالي وما إذا كان التشغيل قد استخدم `Cloud + Local` أو `Cloud only`، ثم جرب جلسة جديدة ونموذجا احتياطيا:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="تنتهي مهلة النموذج المحلي البارد">
    قد تحتاج النماذج المحلية الكبيرة إلى تحميل أول طويل قبل بدء البث. أبق المهلة مقصورة على مزود Ollama، ويمكنك اختياريا أن تطلب من Ollama إبقاء النموذج محملا بين الأدوار:

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

    إذا كان المضيف نفسه بطيئا في قبول الاتصالات، فإن `timeoutSeconds` يمدد أيضا مهلة اتصال Undici المحروسة لهذا المزود.

  </Accordion>

  <Accordion title="نموذج السياق الكبير بطيء جدا أو تنفد ذاكرته">
    تعلن كثير من نماذج Ollama عن سياقات أكبر مما تستطيع عتادك تشغيله براحة. يستخدم Ollama الأصلي افتراضي سياق وقت التشغيل الخاص بـ Ollama ما لم تضبط `params.num_ctx`. حدّد كلا من ميزانية OpenClaw وسياق طلب Ollama عندما تريد زمنا متوقعا لأول رمز:

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

    خفّض `contextWindow` أولا إذا كان OpenClaw يرسل مطالبة كبيرة جدا. خفّض `params.num_ctx` إذا كان Ollama يحمّل سياق وقت تشغيل أكبر من قدرة الجهاز. خفّض `maxTokens` إذا كان التوليد يستغرق وقتا طويلا جدا.

  </Accordion>
</AccordionGroup>

<Note>
مزيد من المساعدة: [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) و[الأسئلة الشائعة](/ar/help/faq).
</Note>

## ذو صلة

<CardGroup cols={2}>
  <Card title="مزودو النماذج" href="/ar/concepts/model-providers" icon="layers">
    نظرة عامة على جميع المزودين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="اختيار النموذج" href="/ar/concepts/models" icon="brain">
    كيفية اختيار النماذج وتهيئتها.
  </Card>
  <Card title="بحث الويب عبر Ollama" href="/ar/tools/ollama-search" icon="magnifying-glass">
    تفاصيل الإعداد والسلوك الكاملة لبحث الويب المدعوم من Ollama.
  </Card>
  <Card title="الإعداد" href="/ar/gateway/configuration" icon="gear">
    مرجع الإعداد الكامل.
  </Card>
</CardGroup>
