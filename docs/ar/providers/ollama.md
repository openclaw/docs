---
read_when:
    - تريد تشغيل OpenClaw باستخدام نماذج سحابية أو محلية عبر Ollama
    - تحتاج إلى إرشادات إعداد Ollama وتكوينه
    - تريد نماذج الرؤية في Ollama لفهم الصور
summary: تشغيل OpenClaw مع Ollama (النماذج السحابية والمحلية)
title: Ollama
x-i18n:
    generated_at: "2026-06-27T18:26:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 929db683f4861f117f5866bdbc4af9a70752b2848a6f09437eb2f8b32b5ff37b
    source_path: providers/ollama.md
    workflow: 16
---

يتكامل OpenClaw مع واجهة Ollama الأصلية (`/api/chat`) للنماذج السحابية المستضافة وخوادم Ollama المحلية/ذاتية الاستضافة. يمكنك استخدام Ollama بثلاثة أوضاع: `Cloud + Local` عبر مضيف Ollama يمكن الوصول إليه، أو `Cloud only` مقابل `https://ollama.com`، أو `Local only` مقابل مضيف Ollama يمكن الوصول إليه.

يسجل OpenClaw أيضًا `ollama-cloud` كمعرف مزود مستضاف من الدرجة الأولى للاستخدام المباشر مع Ollama Cloud. استخدم مراجع مثل `ollama-cloud/kimi-k2.5:cloud` عندما تريد توجيهًا سحابيًا فقط من دون مشاركة معرف المزود المحلي `ollama`.

لصفحة الإعداد المخصصة للسحابة فقط، راجع [Ollama Cloud](/ar/providers/ollama-cloud).

<Warning>
**مستخدمو Ollama البعيدون**: لا تستخدم عنوان URL المتوافق مع OpenAI بنمط `/v1` (`http://host:11434/v1`) مع OpenClaw. يؤدي ذلك إلى تعطيل استدعاء الأدوات وقد تُخرج النماذج JSON أدوات خامًا كنص عادي. استخدم عنوان URL الأصلي لواجهة Ollama بدلًا من ذلك: `baseUrl: "http://host:11434"` (من دون `/v1`).
</Warning>

يستخدم إعداد مزود Ollama المفتاح `baseUrl` كمفتاح قياسي. يقبل OpenClaw أيضًا `baseURL` للتوافق مع أمثلة نمط OpenAI SDK، لكن يجب أن تفضل الإعدادات الجديدة `baseUrl`.

## قواعد المصادقة

<AccordionGroup>
  <Accordion title="المضيفون المحليون ومضيفو LAN">
    لا تحتاج مضيفات Ollama المحلية ومضيفات LAN إلى رمز bearer حقيقي. يستخدم OpenClaw علامة `ollama-local` المحلية فقط لعناوين URL الأساسية لـ Ollama الخاصة بـ local loopback، والشبكات الخاصة، و`.local`، وأسماء المضيفين المجردة.
  </Accordion>
  <Accordion title="المضيفون البعيدون ومضيفو Ollama Cloud">
    تتطلب المضيفات العامة البعيدة وOllama Cloud (`https://ollama.com`) اعتمادًا حقيقيًا عبر `OLLAMA_API_KEY`، أو ملف تعريف مصادقة، أو `apiKey` الخاص بالمزود. للاستخدام المستضاف المباشر، فضّل المزود `ollama-cloud`.
  </Accordion>
  <Accordion title="معرفات المزود المخصصة">
    تتبع معرفات المزود المخصصة التي تضبط `api: "ollama"` القواعد نفسها. على سبيل المثال، يمكن لمزود `ollama-remote` يشير إلى مضيف Ollama خاص على LAN أن يستخدم `apiKey: "ollama-local"`، وستحل الوكلاء الفرعية تلك العلامة عبر خطاف مزود Ollama بدلًا من التعامل معها كاعتماد مفقود. يمكن لبحث الذاكرة أيضًا ضبط `agents.defaults.memorySearch.provider` على معرف المزود المخصص ذلك حتى تستخدم التضمينات نقطة نهاية Ollama المطابقة.
  </Accordion>
  <Accordion title="ملفات تعريف المصادقة">
    يخزن `auth-profiles.json` الاعتماد لمعرف مزود. ضع إعدادات نقطة النهاية (`baseUrl`، و`api`، ومعرفات النماذج، والترويسات، والمهلات) في `models.providers.<id>`. ملفات تعريف المصادقة المسطحة الأقدم مثل `{ "ollama-windows": { "apiKey": "ollama-local" } }` ليست تنسيق تشغيل؛ شغّل `openclaw doctor --fix` لإعادة كتابتها إلى ملف تعريف مفتاح API القياسي `ollama-windows:default` مع نسخة احتياطية. وجود `baseUrl` في ذلك الملف ضجيج توافق ويجب نقله إلى إعداد المزود.
  </Accordion>
  <Accordion title="نطاق تضمين الذاكرة">
    عند استخدام Ollama لتضمينات الذاكرة، تُحصر مصادقة bearer في المضيف الذي أُعلنت فيه:

    - يُرسل مفتاح مستوى المزود فقط إلى مضيف Ollama الخاص بذلك المزود.
    - يُرسل `agents.*.memorySearch.remote.apiKey` فقط إلى مضيف التضمين البعيد الخاص به.
    - تُعامل قيمة البيئة `OLLAMA_API_KEY` الصرفة كاصطلاح Ollama Cloud، ولا تُرسل افتراضيًا إلى المضيفين المحليين أو ذاتيي الاستضافة.

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

        اختر **Ollama** من قائمة المزودين.
      </Step>
      <Step title="اختر وضعك">
        - **Cloud + Local** — مضيف Ollama محلي مع نماذج سحابية موجهة عبر ذلك المضيف
        - **Cloud only** — نماذج Ollama مستضافة عبر `https://ollama.com`
        - **Local only** — نماذج محلية فقط

      </Step>
      <Step title="اختر نموذجًا">
        يطلب `Cloud only` قيمة `OLLAMA_API_KEY` ويقترح افتراضيات سحابية مستضافة. يطلب `Cloud + Local` و`Local only` عنوان URL أساسيًا لـ Ollama، ويكتشفان النماذج المتاحة، ويسحبان تلقائيًا النموذج المحلي المحدد إذا لم يكن متاحًا بعد. عندما يبلغ Ollama عن وسم `:latest` مثبت مثل `gemma4:latest`، يعرض الإعداد ذلك النموذج المثبت مرة واحدة بدلًا من عرض كل من `gemma4` و`gemma4:latest` أو سحب الاسم المستعار المجرد مرة أخرى. يتحقق `Cloud + Local` أيضًا مما إذا كان مضيف Ollama هذا مسجل الدخول للوصول السحابي.
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

    يمكنك اختياريًا تحديد عنوان URL أساسي مخصص أو نموذج:

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
      <Step title="اختر السحابة أو المحلي">
        - **Cloud + Local**: ثبّت Ollama، وسجّل الدخول باستخدام `ollama signin`، ووجّه طلبات السحابة عبر ذلك المضيف
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
    يستخدم `Cloud + Local` مضيف Ollama يمكن الوصول إليه كنقطة تحكم لكل من النماذج المحلية والسحابية. هذا هو التدفق الهجين المفضل لدى Ollama.

    استخدم **Cloud + Local** أثناء الإعداد. يطلب OpenClaw عنوان URL الأساسي لـ Ollama، ويكتشف النماذج المحلية من ذلك المضيف، ويتحقق مما إذا كان المضيف مسجل الدخول للوصول السحابي باستخدام `ollama signin`. عندما يكون المضيف مسجل الدخول، يقترح OpenClaw أيضًا افتراضيات سحابية مستضافة مثل `kimi-k2.5:cloud` و`minimax-m2.7:cloud` و`glm-5.1:cloud`.

    إذا لم يكن المضيف مسجل الدخول بعد، يبقي OpenClaw الإعداد محليًا فقط حتى تشغّل `ollama signin`.

  </Tab>

  <Tab title="Cloud only">
    يعمل `Cloud only` مقابل واجهة Ollama المستضافة عند `https://ollama.com`.

    استخدم **Cloud only** أثناء الإعداد. يطلب OpenClaw قيمة `OLLAMA_API_KEY`، ويضبط `baseUrl: "https://ollama.com"`، ويزرع قائمة النماذج السحابية المستضافة. لا يتطلب هذا المسار خادم Ollama محليًا أو `ollama signin`.

    تُملأ قائمة النماذج السحابية المعروضة أثناء `openclaw onboard` مباشرة من `https://ollama.com/api/tags`، بحد أقصى 500 إدخال، لذا يعكس المنتقي الفهرس المستضاف الحالي بدلًا من بذرة ثابتة. إذا تعذر الوصول إلى `ollama.com` أو لم يُرجع أي نماذج وقت الإعداد، يعود OpenClaw إلى الاقتراحات السابقة المضمنة في الكود حتى يكتمل الإعداد الأولي.

    يمكنك أيضًا إعداد مزود السحابة من الدرجة الأولى مباشرة:

    ```bash
    openclaw onboard --auth-choice ollama-cloud
    openclaw models set ollama-cloud/kimi-k2.5:cloud
    ```

  </Tab>

  <Tab title="Local only">
    في وضع المحلي فقط، يكتشف OpenClaw النماذج من نسخة Ollama المهيأة. هذا المسار مخصص لخوادم Ollama المحلية أو ذاتية الاستضافة.

    يقترح OpenClaw حاليًا `gemma4` كافتراضي محلي.

  </Tab>
</Tabs>

## اكتشاف النماذج (مزود ضمني)

عندما تضبط `OLLAMA_API_KEY` (أو ملف تعريف مصادقة) و**لا** تعرّف `models.providers.ollama` أو مزودًا بعيدًا مخصصًا آخر مع `api: "ollama"`، يكتشف OpenClaw النماذج من نسخة Ollama المحلية عند `http://127.0.0.1:11434`.

| السلوك             | التفاصيل                                                                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| استعلام الفهرس        | يستعلم `/api/tags`                                                                                                                                                  |
| اكتشاف القدرات | يستخدم عمليات بحث `/api/show` بأفضل جهد لقراءة `contextWindow`، ومعاملات Modelfile الموسعة `num_ctx`، والقدرات بما في ذلك الرؤية/الأدوات                       |
| نماذج الرؤية        | النماذج التي تبلغ `/api/show` عن امتلاكها قدرة `vision` تُعلّم على أنها قادرة على الصور (`input: ["text", "image"]`)، لذلك يحقن OpenClaw الصور تلقائيًا في الموجّه  |
| اكتشاف الاستدلال  | يستخدم قدرات `/api/show` عند توفرها، بما في ذلك `thinking`؛ ويعود إلى استدلال من اسم النموذج (`r1`، و`reasoning`، و`think`) عندما يحذف Ollama القدرات |
| حدود الرموز         | يضبط `maxTokens` على سقف الرموز الأقصى الافتراضي لـ Ollama المستخدم بواسطة OpenClaw                                                                                                |
| التكاليف                | يضبط كل التكاليف على `0`                                                                                                                                                |

يتجنب هذا إدخالات النماذج اليدوية مع إبقاء الفهرس متوافقًا مع نسخة Ollama المحلية. يمكنك استخدام مرجع كامل مثل `ollama/<pulled-model>:latest` في `infer model run` المحلي؛ يحل OpenClaw ذلك النموذج المثبت من فهرس Ollama المباشر من دون الحاجة إلى إدخال `models.json` مكتوب يدويًا.

بالنسبة إلى مضيفات Ollama المسجلة الدخول، قد تكون بعض نماذج `:cloud` قابلة للاستخدام عبر `/api/chat` و`/api/show` قبل ظهورها في `/api/tags`. عندما تختار صراحة مرجع `ollama/<model>:cloud` كاملًا، يتحقق OpenClaw من ذلك النموذج المفقود بالضبط باستخدام `/api/show` ويضيفه إلى فهرس التشغيل فقط إذا أكد Ollama بيانات تعريف النموذج. تبقى الأخطاء المطبعية تفشل كنماذج غير معروفة بدلًا من إنشائها تلقائيًا.

```bash
# See what models are available
ollama list
openclaw models list
```

لاختبار دخان ضيق لتوليد النص يتجنب سطح أدوات الوكيل الكامل، استخدم `infer model run` المحلي مع مرجع نموذج Ollama كامل:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

لا يزال ذلك المسار يستخدم المزود المهيأ في OpenClaw والمصادقة ونقل Ollama الأصلي، لكنه لا يبدأ دورة وكيل محادثة أو يحمّل سياق MCP/الأدوات. إذا نجح هذا بينما تفشل ردود الوكيل العادية، فاستكشف قدرة النموذج على موجّه/أدوات الوكيل بعد ذلك.

لاختبار دخان ضيق لنموذج رؤية على المسار الخفيف نفسه، أضف ملف صورة واحدًا أو أكثر إلى `infer model run`. يرسل هذا الموجّه والصورة مباشرة إلى نموذج رؤية Ollama المحدد من دون تحميل أدوات المحادثة أو الذاكرة أو سياق الجلسة السابق:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

`model run --file` يقبل الملفات المكتشفة كـ `image/*`، بما في ذلك مُدخلات PNG،
وJPEG، وWebP الشائعة. تُرفض الملفات غير الصورية قبل استدعاء Ollama.
للتعرّف على الكلام، استخدم `openclaw infer audio transcribe` بدلًا من ذلك.

عندما تبدّل محادثة باستخدام `/model ollama/<model>`، يتعامل OpenClaw
مع ذلك كاختيار مستخدم دقيق. إذا كان `baseUrl` المكوّن لـ Ollama
غير قابل للوصول، فسيفشل الرد التالي بخطأ المزوّد بدلًا من الإجابة بصمت
من نموذج احتياطي آخر مكوّن.

تجري مهام cron المعزولة فحص أمان محليًا إضافيًا واحدًا قبل أن تبدأ دورة
الوكيل. إذا تحوّل النموذج المحدد إلى مزوّد Ollama محلي أو على شبكة خاصة أو `.local`
وكان `/api/tags` غير قابل للوصول، يسجل OpenClaw تشغيل cron ذلك
كـ `skipped` مع `ollama/<model>` المحدد في نص الخطأ. يُخزّن فحص
النقطة الطرفية المسبق مؤقتًا لمدة 5 دقائق، لذلك لا تطلق عدة مهام cron
موجّهة إلى خادم Ollama المتوقف نفسه كلها طلبات نموذج فاشلة.

تحقق حيًا من مسار النص المحلي، ومسار البث الأصلي، والتضمينات مقابل
Ollama المحلي باستخدام:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

لاختبارات الدخان لمفاتيح API في Ollama Cloud، وجّه الاختبار الحي إلى `https://ollama.com`
واختر نموذجًا مستضافًا من الفهرس الحالي:

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

يشغّل اختبار الدخان السحابي النص، والبث الأصلي، والبحث على الويب. ويتخطى التضمينات
افتراضيًا لـ `https://ollama.com` لأن مفاتيح API في Ollama Cloud قد لا تخوّل
`/api/embed`. عيّن `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` عندما تريد صراحةً
أن يفشل الاختبار الحي إذا كان المفتاح السحابي المكوّن لا يستطيع استخدام نقطة نهاية التضمين.

لإضافة نموذج جديد، اسحبه ببساطة باستخدام Ollama:

```bash
ollama pull mistral
```

سيُكتشف النموذج الجديد تلقائيًا ويصبح متاحًا للاستخدام.

<Note>
إذا عيّنت `models.providers.ollama` صراحةً، أو كوّنت مزوّدًا بعيدًا مخصصًا مثل `models.providers.ollama-cloud` مع `api: "ollama"`، فسيتم تخطي الاكتشاف التلقائي ويجب عليك تعريف النماذج يدويًا. لا يزال موفرو loopback المخصصون مثل `http://127.0.0.2:11434` يُعاملون كمحليين. راجع قسم التكوين الصريح أدناه.
</Note>

## الرؤية ووصف الصور

يسجل Plugin Ollama المضمّن Ollama كمزوّد فهم وسائط قادر على الصور. يتيح ذلك لـ OpenClaw توجيه طلبات وصف الصور الصريحة وإعدادات نماذج الصور الافتراضية المكوّنة عبر نماذج رؤية Ollama المحلية أو المستضافة.

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

يجب أن يكون `--model` مرجعًا كاملًا بصيغة `<provider/model>`. عند تعيينه، يشغّل `openclaw infer image describe` ذلك النموذج مباشرةً بدلًا من تخطي الوصف لأن النموذج يدعم الرؤية الأصلية.

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

فضّل مرجع `ollama/<model>` الكامل. إذا كان النموذج نفسه مدرجًا ضمن `models.providers.ollama.models` مع `input: ["text", "image"]` ولا يعرّض أي مزوّد صور مكوّن آخر معرّف النموذج المجرد نفسه، يطبّع OpenClaw أيضًا مرجع `imageModel` مجردًا مثل `qwen2.5vl:7b` إلى `ollama/qwen2.5vl:7b`. إذا كان لدى أكثر من مزوّد صور مكوّن معرّف مجرد نفسه، فاستخدم بادئة المزوّد صراحةً.

قد تحتاج نماذج الرؤية المحلية البطيئة إلى مهلة أطول لفهم الصور مقارنةً بالنماذج السحابية. ويمكنها أيضًا أن تتعطل أو تتوقف عندما يحاول Ollama تخصيص سياق الرؤية المعلن بالكامل على عتاد محدود. عيّن مهلة قدرة، وحدّد `num_ctx` في إدخال النموذج عندما تحتاج فقط إلى دورة وصف صورة عادية:

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

تنطبق هذه المهلة على فهم الصور الواردة وعلى أداة `image` الصريحة التي يمكن للوكيل استدعاؤها أثناء دورة. لا يزال `models.providers.ollama.timeoutSeconds` على مستوى المزوّد يتحكم في حارس طلب HTTP الأساسي إلى Ollama لاستدعاءات النموذج العادية.

تحقق حيًا من أداة الصور الصريحة مقابل Ollama المحلي باستخدام:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

إذا عرّفت `models.providers.ollama.models` يدويًا، فضع علامة على نماذج الرؤية بدعم إدخال الصور:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

يرفض OpenClaw طلبات وصف الصور للنماذج غير الموسومة بأنها قادرة على الصور. مع الاكتشاف الضمني، يقرأ OpenClaw ذلك من Ollama عندما يبلّغ `/api/show` عن قدرة رؤية.

## التكوين

<Tabs>
  <Tab title="Basic (implicit discovery)">
    أبسط مسار تمكين محلي فقط يكون عبر متغير بيئة:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    إذا كان `OLLAMA_API_KEY` معيّنًا، يمكنك حذف `apiKey` في إدخال المزوّد وسيملؤه OpenClaw لفحوصات التوفر.
    </Tip>

  </Tab>

  <Tab title="Explicit (manual models)">
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

  <Tab title="Custom base URL">
    إذا كان Ollama يعمل على مضيف أو منفذ مختلف (يعطّل التكوين الصريح الاكتشاف التلقائي، لذا عرّف النماذج يدويًا):

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
    لا تضف `/v1` إلى عنوان URL. يستخدم مسار `/v1` وضعًا متوافقًا مع OpenAI، حيث لا يكون استدعاء الأدوات موثوقًا. استخدم عنوان URL الأساسي لـ Ollama بدون لاحقة مسار.
    </Warning>

  </Tab>
</Tabs>

## وصفات شائعة

استخدم هذه كنقاط بداية واستبدل معرّفات النماذج بالأسماء الدقيقة من `ollama list` أو `openclaw models list --provider ollama`.

<AccordionGroup>
  <Accordion title="Local model with auto-discovery">
    استخدم هذا عندما يعمل Ollama على الجهاز نفسه مثل Gateway وتريد من OpenClaw اكتشاف النماذج المثبتة تلقائيًا.

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    يبقي هذا المسار التكوين في حده الأدنى. لا تضف كتلة `models.providers.ollama` إلا إذا كنت تريد تعريف النماذج يدويًا.

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

    `contextWindow` هو ميزانية السياق من جهة OpenClaw. يُرسل `params.num_ctx` إلى Ollama للطلب. أبقهما متوافقين عندما لا يستطيع عتادك تشغيل السياق المعلن الكامل للنموذج.

  </Accordion>

  <Accordion title="Ollama Cloud only">
    استخدم هذا عندما لا تشغّل خادمًا محليًا وتريد نماذج Ollama المستضافة مباشرةً.

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
    استخدم هذا عندما يكون خادم Ollama محلي أو على LAN قد سجّل الدخول باستخدام `ollama signin` ويجب أن يخدم كلًا من النماذج المحلية ونماذج `:cloud`.

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

  <Accordion title="Multiple Ollama hosts">
    استخدم معرّفات مزوّد مخصصة عندما يكون لديك أكثر من خادم Ollama واحد. يحصل كل مزوّد على المضيف والنماذج والمصادقة والمهلة ومراجع النماذج الخاصة به.

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

    عندما يرسل OpenClaw الطلب، تُزال بادئة المزوّد النشط بحيث يصل `ollama-large/qwen3.5:27b` إلى Ollama باسم `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Lean local model profile">
    تستطيع بعض النماذج المحلية الإجابة عن المطالبات البسيطة، لكنها تواجه صعوبة مع كامل سطح أدوات الوكيل. ابدأ بتقييد الأدوات والسياق قبل تغيير إعدادات وقت التشغيل العامة.

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

    استخدم `compat.supportsTools: false` فقط عندما يفشل النموذج أو الخادم على نحو موثوق في مخططات الأدوات. فهذا يستبدل بعض قدرات الوكيل بالاستقرار.
    يزيل `localModelLean` أدوات المتصفح وCron والرسائل من سطح الوكيل المباشر، ويضع الكتالوجات الأكبر افتراضيا خلف عناصر تحكم Tool Search المهيكلة، إلا عندما يجب أن يحافظ التشغيل على دلالات التسليم المباشر للرسائل، لكنه لا يغيّر سياق وقت تشغيل Ollama أو وضع التفكير. اقرنه مع `params.num_ctx` صريح و`params.thinking: false` لنماذج التفكير الصغيرة بنمط Qwen التي تدخل في حلقات أو تنفق ميزانية الاستجابة على استدلال مخفي.

  </Accordion>
</AccordionGroup>

### اختيار النموذج

بعد التهيئة، تصبح جميع نماذج Ollama الخاصة بك متاحة:

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

تُدعم أيضا معرّفات مزوّدي Ollama المخصصة. عندما يستخدم مرجع نموذج بادئة
المزوّد النشط، مثل `ollama-spark/qwen3:32b`، يزيل OpenClaw تلك
البادئة فقط قبل استدعاء Ollama بحيث يتلقى الخادم `qwen3:32b`.

بالنسبة إلى النماذج المحلية البطيئة، فضّل ضبط الطلب ضمن نطاق المزوّد قبل زيادة
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

ينطبق `timeoutSeconds` على طلب HTTP الخاص بالنموذج، بما في ذلك إعداد الاتصال،
والترويسات، وبث الجسم، والإلغاء الإجمالي المحمي للجلب. يُمرَّر `params.keep_alive`
إلى Ollama بوصفه `keep_alive` في المستوى الأعلى في طلبات `/api/chat` الأصلية؛
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

بالنسبة إلى المضيفين البعيدين، استبدل `127.0.0.1` بالمضيف المستخدم في `baseUrl`. إذا كان `curl` يعمل لكن OpenClaw لا يعمل، فتحقق مما إذا كان Gateway يعمل على جهاز أو حاوية أو حساب خدمة مختلف.

## بحث الويب في Ollama

يدعم OpenClaw **بحث الويب في Ollama** بوصفه مزوّد `web_search` مضمنا.

| الخاصية    | التفاصيل                                                                                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| المضيف        | يستخدم مضيف Ollama المهيأ لديك (`models.providers.ollama.baseUrl` عند ضبطه، وإلا `http://127.0.0.1:11434`)؛ يستخدم `https://ollama.com` واجهة API المستضافة مباشرة |
| المصادقة        | بلا مفتاح لمضيفي Ollama المحليين المسجلين الدخول؛ `OLLAMA_API_KEY` أو مصادقة المزوّد المهيأة للبحث المباشر عبر `https://ollama.com` أو للمضيفين المحميين بالمصادقة               |
| المتطلب | يجب أن تكون المضيفات المحلية/ذاتية الاستضافة قيد التشغيل ومسجلة الدخول باستخدام `ollama signin`؛ يتطلب البحث المستضاف المباشر `baseUrl: "https://ollama.com"` بالإضافة إلى مفتاح API حقيقي من Ollama |

اختر **بحث الويب في Ollama** أثناء `openclaw onboard` أو `openclaw configure --section web`، أو اضبط:

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

بالنسبة إلى daemon محلي مسجل الدخول، يستخدم OpenClaw وكيل `/api/experimental/web_search` الخاص بالـ daemon. بالنسبة إلى `https://ollama.com`، يستدعي نقطة النهاية المستضافة `/api/web_search` مباشرة.

<Note>
للحصول على تفاصيل الإعداد والسلوك الكاملة، راجع [بحث الويب في Ollama](/ar/tools/ollama-search).
</Note>

## التهيئة المتقدمة

<AccordionGroup>
  <Accordion title="Legacy OpenAI-compatible mode">
    <Warning>
    **استدعاء الأدوات غير موثوق في الوضع المتوافق مع OpenAI.** استخدم هذا الوضع فقط إذا كنت تحتاج إلى صيغة OpenAI لوكيل ولا تعتمد على سلوك استدعاء الأدوات الأصلي.
    </Warning>

    إذا كنت تحتاج إلى استخدام نقطة النهاية المتوافقة مع OpenAI بدلا من ذلك (على سبيل المثال، خلف وكيل لا يدعم إلا صيغة OpenAI)، فاضبط `api: "openai-completions"` صراحة:

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

    عند استخدام `api: "openai-completions"` مع Ollama، يحقن OpenClaw القيمة `options.num_ctx` افتراضيا حتى لا يعود Ollama بصمت إلى نافذة سياق قدرها 4096. إذا كان الوكيل/المنبع لديك يرفض حقول `options` غير المعروفة، فعطّل هذا السلوك:

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
    بالنسبة إلى النماذج المكتشفة تلقائيا، يستخدم OpenClaw نافذة السياق التي يبلغ عنها Ollama عند توفرها، بما في ذلك قيم `PARAMETER num_ctx` الأكبر من ملفات Modelfile المخصصة. وإلا فإنه يعود إلى نافذة سياق Ollama الافتراضية التي يستخدمها OpenClaw.

    يمكنك ضبط القيم الافتراضية `contextWindow` و`contextTokens` و`maxTokens` على مستوى المزوّد لكل نموذج ضمن ذلك المزوّد من Ollama، ثم تجاوزها لكل نموذج عند الحاجة. `contextWindow` هي ميزانية المطالبة وCompaction في OpenClaw. تترك طلبات Ollama الأصلية `options.num_ctx` غير مضبوطة ما لم تهيئ `params.num_ctx` صراحة، بحيث يستطيع Ollama تطبيق الإعداد الافتراضي الخاص به بناء على النموذج أو `OLLAMA_CONTEXT_LENGTH` أو VRAM. لتحديد سقف أو فرض سياق وقت تشغيل Ollama لكل طلب من دون إعادة بناء Modelfile، اضبط `params.num_ctx`؛ تُتجاهل القيم غير الصالحة والصفرية والسالبة وغير المنتهية. إذا قمت بترقية تهيئة أقدم كانت تستخدم فقط `contextWindow` أو `maxTokens` لفرض سياق طلب Ollama أصلي، فشغّل `openclaw doctor --fix` لنسخ ميزانيات المزوّد أو النموذج الصريحة تلك إلى `params.num_ctx`. لا يزال مهايئ Ollama المتوافق مع OpenAI يحقن `options.num_ctx` افتراضيا من `params.num_ctx` أو `contextWindow` المهيأين؛ عطّل ذلك باستخدام `injectNumCtxForOpenAICompat: false` إذا كان المنبع لديك يرفض `options`.

    تقبل إدخالات نموذج Ollama الأصلية أيضا خيارات وقت تشغيل Ollama الشائعة ضمن `params`، بما في ذلك `temperature` و`top_p` و`top_k` و`min_p` و`num_predict` و`stop` و`repeat_penalty` و`num_batch` و`num_thread` و`use_mmap`. يمرر OpenClaw مفاتيح طلب Ollama فقط، لذلك لا تتسرب معاملات وقت تشغيل OpenClaw مثل `streaming` إلى Ollama. استخدم `params.think` أو `params.thinking` لإرسال `think` الخاص بـ Ollama في المستوى الأعلى؛ تعطل `false` التفكير على مستوى API لنماذج التفكير بنمط Qwen.

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

    يعمل أيضا `agents.defaults.models["ollama/<model>"].params.num_ctx` لكل نموذج. إذا كان كلاهما مهيأ، فإن إدخال نموذج المزوّد الصريح يتغلب على الإعداد الافتراضي للوكيل.

  </Accordion>

  <Accordion title="Thinking control">
    بالنسبة إلى نماذج Ollama الأصلية، يمرر OpenClaw التحكم في التفكير كما يتوقعه Ollama: `think` في المستوى الأعلى، وليس `options.think`. النماذج المكتشفة تلقائيا التي تتضمن استجابة `/api/show` لديها قدرة `thinking` تعرض `/think low` و`/think medium` و`/think high` و`/think max`؛ أما النماذج غير المفكرة فتعرض فقط `/think off`.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    يمكنك أيضا ضبط إعداد افتراضي للنموذج:

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

    يمكن لـ `params.think` أو `params.thinking` لكل نموذج تعطيل تفكير API في Ollama أو فرضه لنموذج مهيأ محدد. يحافظ OpenClaw على معاملات النموذج الصريحة تلك عندما لا يتضمن التشغيل النشط إلا الإعداد الافتراضي الضمني `off`؛ أما أوامر وقت التشغيل غير `off` مثل `/think medium` فلا تزال تتجاوز التشغيل النشط.

  </Accordion>

  <Accordion title="Reasoning models">
    يتعامل OpenClaw مع النماذج ذات الأسماء مثل `deepseek-r1` أو `reasoning` أو `think` على أنها قادرة على الاستدلال افتراضيا.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    لا حاجة إلى أي تهيئة إضافية. يوسمها OpenClaw تلقائيا.

  </Accordion>

  <Accordion title="Model costs">
    Ollama مجاني ويعمل محليا، لذلك تُضبط جميع تكاليف النماذج على $0. ينطبق هذا على النماذج المكتشفة تلقائيا والمُعرّفة يدويا.
  </Accordion>

  <Accordion title="تضمينات الذاكرة">
    يسجل Plugin Ollama المضمن موفر تضمينات للذاكرة من أجل
    [بحث الذاكرة](/ar/concepts/memory). يستخدم عنوان URL الأساسي ومفتاح API
    المكوّنين لـ Ollama، ويستدعي نقطة النهاية الحالية `/api/embed` في Ollama، ويجمع
    عدة مقاطع ذاكرة في طلب `input` واحد عند الإمكان.

    عند `proxy.enabled=true`، تستخدم طلبات تضمين ذاكرة Ollama إلى أصل
    local loopback المضيف الدقيق المشتق من `baseUrl` المكوّن
    المسار المباشر المحروس في OpenClaw بدلا من الوكيل المدار لإعادة التوجيه. يجب أن يكون
    اسم المضيف المكوّن نفسه `localhost` أو قيمة IP حرفية لـ loopback؛
    أما أسماء DNS التي تتحلل فقط إلى loopback فتظل تستخدم مسار الوكيل المدار.
    كما تبقى مضيفات Ollama على LAN وtailnet والشبكات الخاصة والعامة على
    مسار الوكيل المدار. لا ترث عمليات إعادة التوجيه إلى مضيف أو منفذ آخر الثقة.
    لا يزال بإمكان المشغلين ضبط إعداد `proxy.loopbackMode: "proxy"` العام
    لإرسال حركة loopback عبر الوكيل، أو `proxy.loopbackMode: "block"`
    لرفض اتصالات loopback قبل فتح اتصال؛ راجع
    [الوكيل المدار](/ar/security/network-proxy#gateway-loopback-mode) لمعرفة
    التأثير على مستوى العملية لهذا الإعداد.

    | الخاصية      | القيمة               |
    | ------------- | ------------------- |
    | النموذج الافتراضي | `nomic-embed-text`  |
    | السحب التلقائي     | نعم — يتم سحب نموذج التضمين تلقائيا إذا لم يكن موجودا محليا |

    تستخدم التضمينات وقت الاستعلام بادئات الاسترجاع للنماذج التي تتطلبها أو توصي بها، بما في ذلك `nomic-embed-text` و`qwen3-embedding` و`mxbai-embed-large`. تظل دفعات مستندات الذاكرة خاما حتى لا تحتاج الفهارس الحالية إلى ترحيل تنسيق.

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

    بالنسبة إلى مضيف تضمينات بعيد، أبق المصادقة محصورة بذلك المضيف:

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

  <Accordion title="إعدادات البث">
    يستخدم تكامل Ollama في OpenClaw **واجهة Ollama API الأصلية** (`/api/chat`) افتراضيا، وهي تدعم البث واستدعاء الأدوات في الوقت نفسه بالكامل. لا يلزم أي إعداد خاص.

    بالنسبة إلى طلبات `/api/chat` الأصلية، يمرر OpenClaw أيضا التحكم في التفكير مباشرة إلى Ollama: يرسل `/think off` و`openclaw agent --thinking off` القيمة العلوية `think: false` ما لم تكن قيمة نموذج صريحة `params.think`/`params.thinking` مكوّنة، بينما يرسل `/think low|medium|high` سلسلة جهد `think` العلوية المطابقة. يتم تعيين `/think max` إلى أعلى جهد أصلي في Ollama، وهو `think: "high"`.

    <Tip>
    إذا كنت بحاجة إلى استخدام نقطة النهاية المتوافقة مع OpenAI، فراجع قسم "وضع التوافق القديم مع OpenAI" أعلاه. قد لا يعمل البث واستدعاء الأدوات في الوقت نفسه في ذلك الوضع.
    </Tip>

  </Accordion>
</AccordionGroup>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="حلقة تعطل WSL2 (إعادات تشغيل متكررة)">
    على WSL2 مع NVIDIA/CUDA، ينشئ مثبّت Ollama الرسمي لنظام Linux وحدة systemd باسم `ollama.service` مع `Restart=always`. إذا بدأت هذه الخدمة تلقائيا وحملت نموذجا مدعوما بوحدة GPU أثناء إقلاع WSL2، فيمكن أن يثبت Ollama ذاكرة المضيف أثناء تحميل النموذج. لا يستطيع استرداد ذاكرة Hyper-V دائما استعادة تلك الصفحات المثبتة، لذا يمكن أن ينهي Windows آلة WSL2 الافتراضية، ثم يبدأ systemd تشغيل Ollama مرة أخرى، وتتكرر الحلقة.

    أدلة شائعة:

    - إعادات تشغيل أو إنهاءات متكررة لـ WSL2 من جهة Windows
    - استهلاك CPU مرتفع في `app.slice` أو `ollama.service` بعد بدء تشغيل WSL2 بقليل
    - SIGTERM من systemd بدلا من حدث قاتل OOM في Linux

    يسجل OpenClaw تحذيرا عند بدء التشغيل عندما يكتشف WSL2، وتمكين `ollama.service` مع `Restart=always`، ووجود علامات CUDA مرئية.

    التخفيف:

    ```bash
    sudo systemctl disable ollama
    ```

    أضف هذا إلى `%USERPROFILE%\.wslconfig` على جهة Windows، ثم شغّل `wsl --shutdown`:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    عيّن مدة keep-alive أقصر في بيئة خدمة Ollama، أو ابدأ Ollama يدويا فقط عندما تحتاج إليه:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    راجع [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317).

  </Accordion>

  <Accordion title="لم يتم اكتشاف Ollama">
    تأكد من أن Ollama قيد التشغيل وأنك عيّنت `OLLAMA_API_KEY` (أو ملف مصادقة)، وأنك **لم** تعرّف إدخالا صريحا `models.providers.ollama`:

    ```bash
    ollama serve
    ```

    تحقق من إمكانية الوصول إلى API:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="لا توجد نماذج متاحة">
    إذا لم يكن نموذجك مدرجا، فإما أن تسحب النموذج محليا أو تعرّفه صراحة في `models.providers.ollama`.

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="تم رفض الاتصال">
    تحقق من أن Ollama يعمل على المنفذ الصحيح:

    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="المضيف البعيد يعمل مع curl وليس مع OpenClaw">
    تحقق من الجهاز نفسه ووقت التشغيل نفسه اللذين يشغلان Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    أسباب شائعة:

    - يشير `baseUrl` إلى `localhost`، لكن Gateway يعمل داخل Docker أو على مضيف آخر.
    - يستخدم عنوان URL المسار `/v1`، ما يختار السلوك المتوافق مع OpenAI بدلا من Ollama الأصلي.
    - يحتاج المضيف البعيد إلى تغييرات في جدار الحماية أو ربط LAN على جهة Ollama.
    - النموذج موجود على عفريت حاسوبك المحمول لكنه غير موجود على العفريت البعيد.

  </Accordion>

  <Accordion title="يخرج النموذج JSON الأدوات كنص">
    يعني هذا عادة أن الموفر يستخدم الوضع المتوافق مع OpenAI أو أن النموذج لا يستطيع التعامل مع مخططات الأدوات.

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

  <Accordion title="يعيد Kimi أو GLM رموزا مشوشة">
    يتم التعامل مع استجابات Kimi/GLM المستضافة التي تكون طويلة ومكوّنة من سلاسل رموز غير لغوية كمخرجات موفر فاشلة بدلا من إجابة مساعد ناجحة. يتيح ذلك لإعادة المحاولة أو الرجوع الاحتياطي أو معالجة الأخطاء العادية تولي الأمر دون حفظ النص التالف في الجلسة.

    إذا حدث ذلك مرارا، فالتقط اسم النموذج الخام وملف الجلسة الحالي وما إذا كان التشغيل قد استخدم `Cloud + Local` أو `Cloud only`، ثم جرّب جلسة جديدة ونموذجا احتياطيا:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="تنتهي مهلة النموذج المحلي البارد">
    قد تحتاج النماذج المحلية الكبيرة إلى تحميل أول طويل قبل بدء البث. أبق المهلة محصورة بموفر Ollama، واطلب اختياريا من Ollama إبقاء النموذج محملا بين الأدوار:

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

    إذا كان المضيف نفسه بطيئا في قبول الاتصالات، فإن `timeoutSeconds` يمدد أيضا مهلة اتصال Undici المحروسة لهذا الموفر.

  </Accordion>

  <Accordion title="نموذج السياق الكبير بطيء جدا أو تنفد ذاكرته">
    تعلن كثير من نماذج Ollama عن سياقات أكبر مما يمكن لعتادك تشغيله براحة. يستخدم Ollama الأصلي الإعداد الافتراضي لسياق وقت التشغيل الخاص بـ Ollama ما لم تضبط `params.num_ctx`. حدّد كلا من ميزانية OpenClaw وسياق طلب Ollama عندما تريد زمنا متوقعا لأول رمز:

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

    خفّض `contextWindow` أولا إذا كان OpenClaw يرسل مطالبة طويلة جدا. خفّض `params.num_ctx` إذا كان Ollama يحمّل سياق وقت تشغيل أكبر مما ينبغي للجهاز. خفّض `maxTokens` إذا كان التوليد يستغرق وقتا طويلا.

  </Accordion>
</AccordionGroup>

<Note>
مزيد من المساعدة: [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) و[الأسئلة الشائعة](/ar/help/faq).
</Note>

## ذات صلة

<CardGroup cols={2}>
  <Card title="موفرو النماذج" href="/ar/concepts/model-providers" icon="layers">
    نظرة عامة على جميع الموفرين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="اختيار النموذج" href="/ar/concepts/models" icon="brain">
    كيفية اختيار النماذج وتكوينها.
  </Card>
  <Card title="بحث الويب في Ollama" href="/ar/tools/ollama-search" icon="magnifying-glass">
    تفاصيل الإعداد والسلوك الكاملة لبحث الويب المدعوم من Ollama.
  </Card>
  <Card title="الإعدادات" href="/ar/gateway/configuration" icon="gear">
    مرجع الإعدادات الكامل.
  </Card>
</CardGroup>
