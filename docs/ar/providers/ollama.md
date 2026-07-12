---
read_when:
    - تريد تشغيل OpenClaw باستخدام نماذج سحابية أو محلية عبر Ollama
    - تحتاج إلى إرشادات لإعداد Ollama وتهيئته
    - تريد استخدام نماذج الرؤية من Ollama لفهم الصور
summary: شغّل OpenClaw باستخدام Ollama (النماذج السحابية والمحلية)
title: Ollama
x-i18n:
    generated_at: "2026-07-12T06:23:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aaa2ab1cf22b318499ef2a040c9e356bfb1c24be811ae0749cce0090f5978c13
    source_path: providers/ollama.md
    workflow: 16
---

يتواصل OpenClaw مع واجهة API الأصلية لـ Ollama (`/api/chat`)، وليس مع نقطة النهاية
`/v1` المتوافقة مع OpenAI. تُدعَم ثلاثة أوضاع:

| الوضع          | ما يستخدمه                                                                     |
| ------------- | -------------------------------------------------------------------------------- |
| السحابة + المحلي | مضيف Ollama يمكن الوصول إليه، يقدّم النماذج المحلية ونماذج `:cloud` (إذا كان المستخدم مسجّل الدخول) |
| السحابة فقط    | `https://ollama.com` مباشرةً، من دون خدمة محلية                                   |
| المحلي فقط     | مضيف Ollama يمكن الوصول إليه، والنماذج المحلية فقط                               |

لإعداد السحابة فقط باستخدام معرّف المزوّد المخصص `ollama-cloud`، راجع
[سحابة Ollama](/ar/providers/ollama-cloud). استخدم مراجع `ollama-cloud/<model>` عندما
تريد إبقاء التوجيه السحابي منفصلًا عن مزوّد `ollama` محلي.

<Warning>
لا تستخدم عنوان URL المتوافق مع OpenAI الذي يتضمن `/v1` (`http://host:11434/v1`). فهو يعطّل استدعاء الأدوات، وقد تُخرج النماذج بيانات JSON أولية لاستدعاء الأدوات كنص عادي. استخدم عنوان URL الأصلي: `baseUrl: "http://host:11434"` (من دون `/v1`).
</Warning>

مفتاح الإعداد الأساسي هو `baseUrl`. ويُقبل `baseURL` أيضًا في
الأمثلة التي تتبع نمط OpenAI SDK، لكن ينبغي أن تستخدم الإعدادات الجديدة `baseUrl`.

## قواعد المصادقة

<AccordionGroup>
  <Accordion title="المضيفون المحليون ومضيفو الشبكة المحلية">
    لا تحتاج عناوين URL الخاصة بـ Ollama التي تستخدم الاسترجاع المحلي أو الشبكات الخاصة أو `.local` أو اسم مضيف مجردًا إلى رمز حامل حقيقي. يستخدم OpenClaw العلامة `ollama-local` لهذه العناوين.
  </Accordion>
  <Accordion title="المضيفون البعيدون ومضيفو سحابة Ollama">
    تتطلب المضيفات العامة البعيدة و`https://ollama.com` بيانات اعتماد حقيقية: `OLLAMA_API_KEY` أو ملف تعريف مصادقة أو `apiKey` الخاص بالمزوّد. للاستخدام المستضاف المباشر، يُفضّل مزوّد `ollama-cloud`.
  </Accordion>
  <Accordion title="معرّفات المزوّدين المخصصة">
    يتبع المزوّد المخصص الذي يستخدم `api: "ollama"` القواعد نفسها. على سبيل المثال، يمكن لمزوّد `ollama-remote` الموجّه إلى مضيف خاص على الشبكة المحلية استخدام `apiKey: "ollama-local"`؛ وتحل الوكلاء الفرعية هذه العلامة عبر خطاف مزوّد Ollama بدلًا من اعتبارها بيانات اعتماد مفقودة. ويمكن أيضًا أن يشير `agents.defaults.memorySearch.provider` إلى معرّف مزوّد مخصص لكي تستخدم التضمينات نقطة نهاية Ollama تلك.
  </Accordion>
  <Accordion title="ملفات تعريف المصادقة">
    يخزّن `auth-profiles.json` بيانات اعتماد معرّف المزوّد؛ ضع إعدادات نقطة النهاية (`baseUrl` و`api` والنماذج والرؤوس والمُهل الزمنية) في `models.providers.<id>`. الملفات المسطحة الأقدم، مثل `{ "ollama-windows": { "apiKey": "ollama-local" } }`، ليست تنسيقًا لوقت التشغيل؛ ويعيد `openclaw doctor --fix` كتابتها إلى ملف تعريف أساسي لمفتاح API باسم `ollama-windows:default` مع إنشاء نسخة احتياطية. تُعد قيمة `baseUrl` في ذلك الملف القديم معلومات زائدة، وينبغي نقلها إلى إعدادات المزوّد.
  </Accordion>
  <Accordion title="نطاق تضمينات الذاكرة">
    تقتصر مصادقة الحامل لتضمينات ذاكرة Ollama على المضيف الذي أُعلنت له:

    - لا يُرسل المفتاح على مستوى المزوّد إلا إلى مضيف ذلك المزوّد.
    - لا يُرسل `agents.*.memorySearch.remote.apiKey` إلا إلى مضيف التضمين البعيد الخاص به.
    - تُعامل قيمة بيئة `OLLAMA_API_KEY` المجرّدة باعتبارها اصطلاح سحابة Ollama، ولا تُرسل افتراضيًا إلى المضيفات المحلية أو ذاتية الاستضافة.

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

        اختر **Ollama**، ثم اختر وضعًا: **السحابة + المحلي** أو **السحابة فقط** أو **المحلي فقط**.
      </Step>
      <Step title="اختيار نموذج">
        يطلب وضع `السحابة فقط` إدخال `OLLAMA_API_KEY` ويقترح إعدادات سحابية مستضافة افتراضية. ويطلب وضعا `السحابة + المحلي` و`المحلي فقط` عنوان URL أساسيًا لـ Ollama، ثم يكتشفان النماذج المتاحة ويسحبان النموذج المحلي المحدد تلقائيًا إذا كان مفقودًا. تظهر علامة `:latest` مثبّتة، مثل `gemma4:latest`، مرة واحدة بدلًا من تكرار `gemma4`. ويتحقق وضع `السحابة + المحلي` أيضًا مما إذا كان المضيف مسجّل الدخول للوصول إلى السحابة.
      </Step>
      <Step title="التحقق">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    الوضع غير التفاعلي:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

    الخياران `--custom-base-url` و`--custom-model-id` اختياريان؛ ويؤدي إغفالهما إلى استخدام المضيف المحلي الافتراضي والنموذج المقترح `gemma4`.

  </Tab>

  <Tab title="الإعداد اليدوي">
    <Steps>
      <Step title="تثبيت Ollama وتشغيله">
        احصل عليه من [ollama.com/download](https://ollama.com/download)، ثم اسحب نموذجًا:

        ```bash
        ollama pull gemma4
        ```

        للوصول السحابي الهجين، شغّل `ollama signin` على المضيف نفسه.
      </Step>
      <Step title="تعيين بيانات اعتماد">
        ```bash
        export OLLAMA_API_KEY="ollama-local"    # مضيف محلي/على الشبكة المحلية، تصلح أي قيمة
        export OLLAMA_API_KEY="your-real-key"   # لـ https://ollama.com فقط
        ```

        أو ضمن الإعدادات: `openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"`.
      </Step>
      <Step title="اختيار النموذج">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        أو ضمن الإعدادات:

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

## النماذج السحابية عبر مضيف محلي

يوجّه وضع `السحابة + المحلي` النماذج المحلية ونماذج `:cloud` معًا عبر مضيف
Ollama واحد يمكن الوصول إليه — وهذا هو المسار الهجين في Ollama والوضع الذي ينبغي اختياره أثناء الإعداد
عندما تريد النوعين معًا.

يطلب OpenClaw عنوان URL الأساسي، ويكتشف النماذج المحلية، ويتحقق من
حالة `ollama signin`. وعند تسجيل الدخول، يقترح الإعدادات المستضافة الافتراضية
(`kimi-k2.5:cloud` و`minimax-m2.7:cloud` و`glm-5.1:cloud` و`glm-5.2:cloud`). وإذا
لم يكن المستخدم مسجّل الدخول، يبقى الإعداد محليًا فقط حتى تشغيل `ollama signin`.

للوصول السحابي فقط من دون خدمة محلية، استخدم `openclaw onboard --auth-choice ollama-cloud` وراجع [سحابة Ollama](/ar/providers/ollama-cloud) — لا يحتاج هذا المسار إلى `ollama signin` أو خادم قيد التشغيل:

```bash
openclaw onboard --auth-choice ollama-cloud
openclaw models set ollama-cloud/kimi-k2.5:cloud
```

تُملأ قائمة النماذج السحابية المعروضة أثناء `openclaw onboard` مباشرةً من
`https://ollama.com/api/tags`، بحد أقصى 500 إدخال، لذلك تعكس أداة الاختيار
الدليل المستضاف الحالي. وإذا تعذّر الوصول إلى `ollama.com` أو لم يُرجع أي
نماذج وقت الإعداد، يعود OpenClaw إلى قائمته المقترحة المضمّنة برمجيًا لكي
يكتمل الإعداد الأولي رغم ذلك.

## اكتشاف النماذج (المزوّد الضمني)

عند تعيين `OLLAMA_API_KEY` (أو ملف تعريف مصادقة)، وعدم تعريف
`models.providers.ollama` أو أي مزوّد مخصص آخر يستخدم `api: "ollama"`،
يكتشف OpenClaw النماذج من `http://127.0.0.1:11434`:

| السلوك             | التفاصيل                                                                                                                                                                                                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| استعلام الدليل        | `/api/tags`                                                                                                                                                                                                                                                                                   |
| اكتشاف القدرات | تقرأ محاولة `/api/show` بأفضل جهد `contextWindow` ومعلمات `num_ctx` في Modelfile والقدرات (الرؤية/الأدوات/التفكير)                                                                                                                                                                       |
| نماذج الرؤية        | تعني قدرة `vision` من `/api/show` أن النموذج قادر على معالجة الصور (`input: ["text", "image"]`)                                                                                                                                                                                             |
| اكتشاف الاستدلال  | يستخدم قدرة `thinking` من `/api/show` عند توفرها؛ ويعود إلى استدلال إرشادي من الاسم (`r1` و`reason` و`reasoning` و`think`) عندما يحذف Ollama القدرات. ويُعامل `glm-5.2:cloud` و`deepseek-v4-flash\|pro:cloud` دائمًا كنموذجي استدلال بغض النظر عن القدرات المُبلّغ عنها. |
| حدود الرموز         | تكون القيمة الافتراضية لـ `maxTokens` هي الحد الأقصى للرموز في Ollama لدى OpenClaw                                                                                                                                                                                                                                       |
| التكاليف                | جميع التكاليف تساوي `0`                                                                                                                                                                                                                                                                             |

```bash
ollama list
openclaw models list
```

يؤدي تعيين `models.providers.ollama` مع مصفوفة `models` صريحة، أو
مزوّد مخصص يستخدم `api: "ollama"` و`baseUrl` غير مخصص للاسترجاع المحلي، إلى تعطيل
الاكتشاف التلقائي؛ وعندئذ يجب تعريف النماذج يدويًا (راجع
[الإعدادات](#configuration)). كما يتخطى إدخال `models.providers.ollama` الموجّه إلى
`https://ollama.com` المستضاف عملية الاكتشاف، لأن مزوّد سحابة Ollama يدير النماذج.
وتظل المزوّدات المخصصة للاسترجاع المحلي، مثل
`http://127.0.0.2:11434`، محسوبة كمزوّدات محلية وتحتفظ بالاكتشاف التلقائي.

يمكنك استخدام مرجع كامل، مثل `ollama/<pulled-model>:latest`، من دون
إدخال مكتوب يدويًا في `models.json`؛ إذ يحلّه OpenClaw مباشرةً. وبالنسبة إلى
المضيفات المسجّلة الدخول، يؤدي تحديد مرجع `ollama/<model>:cloud` غير مدرج إلى التحقق من ذلك
النموذج المحدد عبر `/api/show` وإضافته إلى دليل وقت التشغيل فقط إذا أكد Ollama
البيانات الوصفية — وتظل الأخطاء الإملائية تفشل باعتبارها نماذج غير معروفة.

### اختبارات الدخان

لإجراء فحص نصي محدود يتجاوز سطح أدوات الوكيل الكامل:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

أضف `--file` مع صورة لإجراء فحص مبسّط لنموذج رؤية (يقبل PNG/JPEG/WebP؛
وتُرفض الملفات غير الصورية قبل استدعاء Ollama — استخدم
`openclaw infer audio transcribe` للصوت):

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

لا يحمّل أي من المسارين أدوات المحادثة أو الذاكرة أو سياق الجلسة. فإذا نجح
بينما تفشل ردود الوكيل العادية، فمن المرجح أن تكون المشكلة في قدرة النموذج على استخدام الأدوات/الوكيل،
لا في نقطة النهاية.

يُعد تحديد نموذج باستخدام `/model ollama/<model>` اختيارًا دقيقًا للمستخدم: فإذا تعذّر
الوصول إلى `baseUrl` المُعد، يفشل الرد التالي بخطأ المزوّد
بدلًا من الرجوع بصمت إلى نموذج مُعد آخر.

تضيف مهام Cron المعزولة فحص أمان محليًا واحدًا قبل بدء دور الوكيل:
إذا تحلل النموذج المحدد إلى مزوّد Ollama محلي أو على شبكة خاصة أو يستخدم `.local`
وتعذّر الوصول إلى `/api/tags`، يسجّل OpenClaw ذلك التشغيل بالحالة
`skipped` مع النموذج في نص الخطأ. ويُخزّن فحص نقطة النهاية هذا مؤقتًا لمدة
5 دقائق لكل مضيف، لذلك لا تُطلق مهام Cron المتكررة الموجّهة إلى خدمة متوقفة جميعها
طلبات ستفشل.

التحقق المباشر:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

بالنسبة إلى Ollama Cloud، وجّه الاختبار المباشر نفسه إلى نقطة النهاية المستضافة (يتخطى
التضمينات افتراضيًا؛ أجبِر استخدامها عبر `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` لأن
مفتاح السحابة قد لا يصرّح بالوصول إلى `/api/embed`):

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

لإضافة نموذج، نزّله وسيُكتشف تلقائيًا:

```bash
ollama pull mistral
```

## الاستدلال المحلي على Node

يمكن للوكلاء تفويض مهمة قصيرة إلى نموذج Ollama على جهاز مكتبي مقترن أو
Node خادم. تعبر المطالبة والاستجابة اتصال
Gateway/Node الحالي الموثّق؛ ويُنفَّذ الطلب على نقطة نهاية Ollama عبر local loopback الخاصة
بالـ Node (`http://127.0.0.1:11434`).

<Steps>
  <Step title="تشغيل Ollama على Node">
    ```bash
    ollama pull qwen3:0.6b
    ollama list
    ```
  </Step>
  <Step title="توصيل مضيف Node">
    ```bash
    openclaw node run \
      --host <gateway-host> \
      --port 18789 \
      --display-name "Local inference"
    ```

    وافق على الجهاز وأوامر Node الخاصة به على مضيف Gateway، ثم تحقّق:

    ```bash
    openclaw devices list
    openclaw devices approve <deviceRequestId>
    openclaw nodes pending
    openclaw nodes approve <nodeRequestId>
    openclaw nodes status --connected
    ```

    قد يؤدي الاتصال الأول، أو ترقية تضيف أوامر Ollama، إلى طلب
    الموافقة على أوامر Node. إذا اتصلت Node دون الإعلان عن
    `ollama.models` و`ollama.chat`، فتحقّق من `openclaw nodes pending` مرة أخرى.

  </Step>
  <Step title="استخدامه من وكيل">
    يوفّر Plugin Ollama المضمّن أداة `node_inference`. يستدعي الوكلاء
    `action: "discover"` أولًا، ثم `action: "run"` باستخدام Node ونموذج من
    تلك النتيجة (يمكن لـ `run` حذف Node عند اتصال Node واحدة مؤهلة
    بالضبط). على سبيل المثال: "اكتشف نماذج Ollama على عُقدي، ثم استخدم
    أسرع نموذج محمّل لتلخيص هذا النص."
  </Step>
</Steps>

يقرأ الاكتشاف `/api/tags`، ويتحقق من الإمكانات عبر `/api/show`، ويستخدم
`/api/ps` عند توفره لترتيب النماذج المحمّلة بالفعل أولًا. ولا يعيد سوى
النماذج المحلية التي يبلّغ Ollama بأنها قادرة على المحادثة (إمكانية `completion`) —
وتُستبعد صفوف Ollama Cloud والنماذج المخصصة للتضمين فقط. يعطّل كل تشغيل
تفكير النموذج ويضبط المخرجات افتراضيًا على 512 رمزًا (بحد أقصى صارم 8192)، ما لم
يطلب استدعاء الأداة قيمة `maxTokens` مختلفة؛ بعض النماذج (مثل GPT-OSS)
لا تدعم تعطيل التفكير وقد تستمر في إصدار رموز الاستدلال.

لإبقاء Ollama قيد التشغيل على Node دون إتاحته للوكلاء:

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

أعد تشغيل Node (`openclaw node restart`، أو أوقف `openclaw node run` وأعد تشغيله
لجلسة في الواجهة الأمامية). تتوقف Node عن الإعلان عن `ollama.models` و
`ollama.chat`؛ ولا يتأثر Ollama نفسه ولا موفّر Ollama في Gateway.
أعد القيمة إلى `true` وأعد التشغيل لإعادة التمكين؛ وقد يحتاج سطح الأوامر
المتغيّر إلى موافقة `openclaw nodes pending` مرة أخرى بعد إعادة الاتصال.

تحقّق من أوامر Node مباشرةً، دون دورة وكيل:

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
ويحدّد `--timeout` مدة استدعاء Gateway بالكامل، وينبغي أن يكون أكبر.

يستخدم الاستدلال المحلي على Node دائمًا نقطة نهاية local loopback الخاصة بالـ Node — ولا
يعيد استخدام `models.providers.ollama.baseUrl` بعيد/سحابي مُهيّأ. تتوفر
أوامر Node افتراضيًا على مضيفات Node التي تعمل بنظام macOS وLinux وWindows،
وتظل خاضعة لسياسة إقران Node وأوامرها المعتادة.

## الرؤية ووصف الصور

يسجّل Plugin Ollama المضمّن Ollama بصفته موفّرًا لفهم الوسائط
قادرًا على معالجة الصور، بحيث يمكن لـ OpenClaw توجيه طلبات وصف الصور الصريحة
والإعدادات الافتراضية لنموذج الصور المُهيّأ عبر نماذج الرؤية المحلية أو المستضافة من Ollama.

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

يجب أن يكون `--model` مرجعًا كاملًا بصيغة `<provider/model>`؛ وعند تعيينه، يحاول `infer image
describe` استخدام ذلك النموذج أولًا بدلًا من تخطي الوصف للنماذج
التي تدعم الرؤية الأصلية بالفعل. إذا فشل الاستدعاء، يمكن لـ OpenClaw المتابعة
عبر `agents.defaults.imageModel.fallbacks`؛ أما أخطاء إعداد الملف/عنوان URL
فتفشل قبل محاولة الحل الاحتياطي. استخدم `infer image describe` لمسار
فهم الصور في OpenClaw و`imageModel` المُهيّأ؛ واستخدم `infer model run
--file` لإجراء فحص خام متعدد الوسائط باستخدام مطالبة مخصصة.

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

فضّل المرجع الكامل `ollama/<model>`. لا يُطبَّع مرجع `imageModel` مجرد مثل
`qwen2.5vl:7b` إلى `ollama/qwen2.5vl:7b` إلا عندما يكون ذلك النموذج نفسه
مدرجًا ضمن `models.providers.ollama.models` مع
`input: ["text", "image"]` ولا يعرض أي موفّر صور مُهيّأ آخر
المعرّف المجرد نفسه؛ وإلا فاستخدم بادئة الموفّر صراحةً.

قد تحتاج نماذج الرؤية المحلية البطيئة إلى مهلة أطول لفهم الصور مقارنةً
بالنماذج السحابية، وقد تتعطل على الأجهزة محدودة الموارد إذا حاول Ollama
تخصيص سياق الرؤية المُعلن بالكامل للنموذج. عيّن مهلة للإمكانية
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

تنطبق هذه المهلة على فهم الصور الواردة وعلى أداة
`image` الصريحة. ويظل `models.providers.ollama.timeoutSeconds` يتحكم في
مهلة الحماية لطلب Ollama عبر HTTP الأساسي لاستدعاءات النماذج العادية.

التحقق المباشر:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

إذا عرّفت `models.providers.ollama.models` يدويًا، فميّز نماذج الرؤية
صراحةً:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

يرفض OpenClaw طلبات وصف الصور للنماذج غير المميّزة
بأنها قادرة على معالجة الصور. ومع الاكتشاف الضمني، تأتي هذه المعلومة من إمكانية الرؤية
في `/api/show`.

## الإعداد

<Tabs>
  <Tab title="أساسي (اكتشاف ضمني)">
    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    إذا كان `OLLAMA_API_KEY` معيّنًا، فيمكنك حذف `apiKey` من إدخال الموفّر؛ يملؤه OpenClaw لإجراء فحوصات التوفر.
    </Tip>

  </Tab>

  <Tab title="صريح (نماذج يدوية)">
    استخدم الإعداد الصريح لإعداد سحابي مستضاف، أو مضيف/منفذ غير افتراضي، أو فرض
    نوافذ السياق، أو قوائم نماذج يدوية بالكامل:

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
    يعطّل الإعداد الصريح الاكتشاف التلقائي، لذا يجب إدراج النماذج:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // لا تستخدم /v1 — عنوان URL لواجهة Ollama API الأصلية
            api: "ollama", // صريح: يضمن السلوك الأصلي لاستدعاء الأدوات
            timeoutSeconds: 300, // اختياري: مهلة أطول للاتصال/البث للنماذج المحلية الباردة
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
    لا تضف `/v1`. يحدد هذا المسار وضع التوافق مع OpenAI، حيث لا يكون استدعاء الأدوات موثوقًا.
    </Warning>

  </Tab>
</Tabs>

## وصفات شائعة

استبدل معرّفات النماذج بالأسماء الدقيقة من `ollama list` أو
`openclaw models list --provider ollama`.

<AccordionGroup>
  <Accordion title="نموذج محلي مع اكتشاف تلقائي">
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

    `contextWindow` هي ميزانية السياق في OpenClaw؛ وتُرسل `params.num_ctx` إلى
    Ollama. حافظ على توافقهما عندما لا تستطيع الأجهزة تشغيل السياق المُعلن
    بالكامل للنموذج.

  </Accordion>

  <Accordion title="Ollama Cloud فقط">
    دون خدمة محلية، مع استخدام النماذج المستضافة مباشرةً:

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

    لاستخدام معرّف الموفّر المخصص `ollama-cloud` بدلًا من هذه البنية، راجع
    [Ollama Cloud](/ar/providers/ollama-cloud).

  </Accordion>

  <Accordion title="السحابة والمحلي عبر خدمة مسجّل الدخول إليها">
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
    استخدم معرّفات موفّرين مخصصة عند تشغيل أكثر من خادم Ollama؛ إذ يحصل كل خادم
    على مضيف ونماذج ومصادقة ومهلة خاصة به.

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

    يزيل OpenClaw بادئة الموفّر النشط (مع الرجوع إلى بادئة `ollama/`
    المجردة) قبل استدعاء Ollama، ولذلك يصل `ollama-large/qwen3.5:27b`
    إلى Ollama بالصيغة `qwen3.5:27b`.

  </Accordion>

  <Accordion title="ملف تعريف مبسّط للنموذج المحلي">
    تتعامل بعض النماذج المحلية مع المطالبات البسيطة، لكنها تواجه صعوبة مع
    المجموعة الكاملة لأدوات الوكيل. قلّل الأدوات والسياق قبل تعديل إعدادات
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

    استخدم `compat.supportsTools: false` فقط عندما يفشل النموذج أو الخادم
    بشكل موثوق مع مخططات الأدوات، إذ يستبدل ذلك بعض قدرات الوكيل بالاستقرار.
    يزيل `localModelLean` أدوات المتصفح وCron والرسائل وإنشاء الوسائط والصوت
    وPDF الثقيلة من السطح المباشر للوكيل ما لم تكن مطلوبة صراحةً، ويضع
    الكتالوجات الأكبر خلف البحث عن الأدوات. ولا يغيّر سياق وقت تشغيل Ollama
    أو وضع التفكير. استخدمه مع `params.num_ctx` و`params.thinking: false`
    لنماذج التفكير الصغيرة المشابهة لـ Qwen التي تدخل في حلقات أو تستهلك
    ميزانيتها في الاستدلال المخفي.

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

تعمل معرّفات الموفّرين المخصصة بالطريقة نفسها: فبالنسبة إلى مرجع يستخدم بادئة
الموفّر النشط، مثل `ollama-spark/qwen3:32b`، يزيل OpenClaw تلك البادئة قبل
استدعاء Ollama، ويرسل `qwen3:32b`.

بالنسبة إلى النماذج المحلية البطيئة، يُفضّل ضبط الإعدادات على مستوى الموفّر
قبل زيادة مهلة وقت تشغيل الوكيل بالكامل:

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

تغطي `timeoutSeconds` طلب HTTP الخاص بالنموذج: إعداد الاتصال والترويسات
وبث جسم الطلب وإلغاء الجلب المحمي بالكامل. وتُمرّر `params.keep_alive`
بصفتها `keep_alive` على المستوى الأعلى في طلبات `/api/chat` الأصلية؛
اضبطها لكل نموذج عندما يكون وقت التحميل في الجولة الأولى هو موضع الاختناق.

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

بالنسبة إلى المضيفين البعيدين، استبدل `127.0.0.1` بمضيف `baseUrl`. إذا نجح
`curl` ولم ينجح OpenClaw، فتحقق مما إذا كان Gateway يعمل على جهاز أو حاوية
أو حساب خدمة مختلف.

## بحث الويب في Ollama

يتضمن OpenClaw **بحث الويب في Ollama** بوصفه موفّرًا لـ `web_search`.

| الخاصية      | التفاصيل                                                                                                                                                    |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| المضيف       | `models.providers.ollama.baseUrl` عند ضبطه، وإلا `http://127.0.0.1:11434`؛ ويستخدم `https://ollama.com` واجهة API المستضافة مباشرةً                          |
| المصادقة     | بلا مفتاح لمضيف محلي مسجّل الدخول؛ أو `OLLAMA_API_KEY` أو مصادقة الموفّر المُعدّة للبحث المباشر عبر `https://ollama.com` أو المضيفين المحميين بالمصادقة      |
| المتطلبات    | يجب أن تكون المضيفات المحلية/ذاتية الاستضافة قيد التشغيل ومسجّلة الدخول باستخدام `ollama signin`؛ ويتطلب البحث المستضاف المباشر `baseUrl: "https://ollama.com"` مع مفتاح API حقيقي |

اختره أثناء `openclaw onboard` أو `openclaw configure --section web`، أو اضبط:

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

بالنسبة إلى مضيف ذاتي الاستضافة، يحاول OpenClaw أولًا استخدام وكيل
`/api/experimental/web_search` المحلي، ثم يرجع إلى مسار `/api/web_search`
المستضاف على المضيف نفسه؛ وعادةً ما تستجيب خدمة محلية مسجّلة الدخول عبر
الوكيل المحلي. تستخدم الاستدعاءات المباشرة إلى `https://ollama.com` دائمًا
نقطة النهاية المستضافة `/api/web_search`.

<Note>
للاطلاع على الإعداد والسلوك بالكامل، راجع [بحث الويب في Ollama](/ar/tools/ollama-search).
</Note>

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="الوضع القديم المتوافق مع OpenAI">
    <Warning>
    **استدعاء الأدوات غير موثوق في هذا الوضع.** استخدمه فقط عندما يحتاج وكيل إلى تنسيق OpenAI ولا تعتمد على استدعاء الأدوات الأصلي.
    </Warning>

    اضبط `api: "openai-completions"` صراحةً لوكيل خلف
    `/v1/chat/completions`:

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

    قد لا يدعم هذا الوضع البث واستدعاء الأدوات في الوقت نفسه؛ وقد تحتاج إلى
    `params: { streaming: false }` في النموذج.

    يحقن OpenClaw القيمة `options.num_ctx` افتراضيًا في هذا الوضع كي لا يرجع
    Ollama بصمت إلى سياق من 4096 رمزًا. إذا رفض وكيلك حقول `options` غير
    المعروفة، فعطّل ذلك:

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
    يبلّغ عنها `/api/show`، بما في ذلك قيم `PARAMETER num_ctx` الأكبر من
    ملفات Modelfile المخصصة؛ وإلا فإنه يرجع إلى نافذة سياق Ollama الافتراضية
    في OpenClaw.

    تضبط `contextWindow` و`contextTokens` و`maxTokens` على مستوى الموفّر
    القيم الافتراضية لكل نموذج تابع لذلك الموفّر، ويمكن تجاوزها لكل نموذج.
    تمثل `contextWindow` ميزانية المطالبات وCompaction الخاصة بـ OpenClaw.
    تترك طلبات `/api/chat` الأصلية القيمة `options.num_ctx` غير مضبوطة ما لم
    تضبط `params.num_ctx` صراحةً، ولذلك يطبّق Ollama الإعداد الافتراضي الخاص
    بالنموذج أو `OLLAMA_CONTEXT_LENGTH` أو الإعداد المستند إلى VRAM؛ وتُتجاهل
    قيم `params.num_ctx` غير الصالحة أو الصفرية أو السالبة أو غير المحدودة.
    إذا كان إعداد قديم يستخدم `contextWindow`/`maxTokens` فقط لفرض سياق الطلب
    الأصلي، فشغّل `openclaw doctor --fix` لنسخها إلى `params.num_ctx`.
    ويستمر المحوّل المتوافق مع OpenAI في حقن `options.num_ctx` افتراضيًا من
    `params.num_ctx` أو `contextWindow` المُعدّة؛ عطّل ذلك باستخدام
    `injectNumCtxForOpenAICompat: false` إذا رفض المصدر الأعلى `options`.

    تقبل إدخالات النماذج الأصلية أيضًا خيارات وقت تشغيل Ollama الشائعة ضمن
    `params`، وتُمرّر بصفتها `options` أصلية إلى `/api/chat`: وهي `num_keep`
    و`seed` و`num_predict` و`top_k` و`top_p` و`min_p` و`typical_p`
    و`repeat_last_n` و`temperature` و`repeat_penalty` و`presence_penalty`
    و`frequency_penalty` و`stop` و`num_batch` و`num_gpu` و`main_gpu`
    و`use_mmap` و`num_thread`. وتُمرّر بعض المفاتيح (`format` و`keep_alive`
    و`truncate` و`shift`) كحقول طلب على المستوى الأعلى بدلًا من وضعها داخل
    `options`. لا يمرّر OpenClaw سوى مفاتيح طلب Ollama هذه، ولذلك لا تُرسل
    المعاملات الخاصة بوقت التشغيل فقط، مثل `streaming`، إلى Ollama مطلقًا.
    استخدم `params.think` (أو `params.thinking`) لضبط `think` على المستوى
    الأعلى؛ إذ تعطّل القيمة `false` التفكير على مستوى API لنماذج التفكير
    المشابهة لـ Qwen.

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

    تعمل أيضًا `agents.defaults.models["ollama/<model>"].params.num_ctx`
    الخاصة بكل نموذج؛ ويفوز إدخال نموذج الموفّر الصريح إذا ضُبط كلاهما.

  </Accordion>

  <Accordion title="التحكم في التفكير">
    يمرّر OpenClaw التفكير كما يتوقعه Ollama: أي `think` على المستوى الأعلى،
    وليس `options.think`. تعرض النماذج المكتشفة تلقائيًا التي يبلّغ
    `/api/show` عن امتلاكها قدرة `thinking` الخيارات `/think low`
    و`/think medium` و`/think high` و`/think max`؛ بينما لا تعرض النماذج
    غير المفكّرة سوى `/think off`.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    أو اضبط قيمة افتراضية للنموذج:

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

    يمكن لإعدادَي `params.think` و`params.thinking` الخاصَّين بكل نموذج تعطيل التفكير عبر API أو فرضه لنموذج معيّن. يحافظ OpenClaw على هذا الإعداد الصريح عندما لا يتضمن التشغيل النشط سوى القيمة الافتراضية الضمنية `off`؛ ومع ذلك، يظل أمر وقت التشغيل بقيمة غير `off` مثل `/think medium` متجاوزًا له. لا يُرسل طلب تفكير ذي قيمة صادقة مطلقًا إلى نموذج موسوم صراحةً بـ `reasoning: false`؛ بينما يُرسل طلب `think: false` دائمًا بصرف النظر عن ذلك.

  </Accordion>

  <Accordion title="Reasoning models">
    تُعامل النماذج المسماة `deepseek-r1` أو `reasoning` أو `reason` أو `think`
    على أنها قادرة على الاستدلال افتراضيًا — ولا يلزم أي إعداد إضافي:

    ```bash
    ollama pull deepseek-r1:32b
    ```

  </Accordion>

  <Accordion title="Model costs">
    يعمل Ollama محليًا ومجانًا، لذلك تكون جميع تكاليف النماذج `0` لكل من
    النماذج المكتشفة تلقائيًا والمحددة يدويًا.
  </Accordion>

  <Accordion title="Memory embeddings">
    يسجّل Plugin Ollama المضمّن موفّر تضمينات للذاكرة لاستخدامه في
    [البحث في الذاكرة](/ar/concepts/memory). ويستخدم عنوان URL الأساسي ومفتاح API
    المهيأين لـ Ollama، ويستدعي `/api/embed`، ويجمع عدة أجزاء من الذاكرة
    في طلب `input` واحد متى أمكن ذلك.

    عندما يكون `proxy.enabled=true`، تستخدم طلبات التضمين الموجّهة إلى أصل
    local loopback المحلي للمضيف والمشتق بدقة من `baseUrl` المهيأ، المسار
    المباشر المحمي في OpenClaw بدلًا من الوكيل الأمامي المُدار. يجب أن يكون
    اسم المضيف المهيأ نفسه `localhost` أو عنوان IP حرفيًا للاسترجاع الحلقي —
    أما أسماء DNS التي لا تفعل سوى التحويل إلى عنوان استرجاع حلقي فتظل تستخدم
    مسار الوكيل المُدار. وتظل مضيفات Ollama الموجودة على الشبكة المحلية أو
    شبكة tailnet أو الشبكة الخاصة أو الشبكة العامة دائمًا على مسار الوكيل
    المُدار، كما أن عمليات إعادة التوجيه إلى مضيف أو منفذ آخر لا ترث الثقة.
    يوجّه `proxy.loopbackMode: "proxy"` حركة الاسترجاع الحلقي عبر الوكيل على
    أي حال؛ بينما يمنعها `proxy.loopbackMode: "block"` قبل الاتصال — راجع
    [الوكيل المُدار](/ar/security/network-proxy#gateway-loopback-mode).

    | الخاصية | القيمة |
    | --- | --- |
    | النموذج الافتراضي | `nomic-embed-text` |
    | السحب التلقائي | نعم، إذا لم يكن موجودًا محليًا |
    | التزامن المضمّن الافتراضي | 1 (تستخدم الموفّرات الأخرى قيمة افتراضية أعلى؛ ارفعها باستخدام `nonBatchConcurrency` إذا كان المضيف قادرًا على تحمّل ذلك) |

    تستخدم التضمينات في وقت الاستعلام بادئات الاسترجاع للنماذج التي تتطلبها
    أو توصي بها: `nomic-embed-text` و`qwen3-embedding` و
    `mxbai-embed-large`. وتظل دفعات المستندات دون تعديل، لذلك لا تحتاج
    الفهارس الحالية إلى ترحيل للتنسيق.

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

    عند استخدام مضيف بعيد للتضمينات، اجعل نطاق المصادقة مقتصرًا على ذلك المضيف:

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
    يستخدم Ollama **واجهة API الأصلية** (`/api/chat`) افتراضيًا، وهي تدعم
    البث واستدعاء الأدوات معًا — ولا يلزم أي إعداد خاص.

    بالنسبة إلى الطلبات الأصلية، يُمرَّر التحكم في التفكير مباشرةً: يرسل
    `/think off` و`openclaw agent --thinking off` القيمة `think: false`
    في المستوى الأعلى، ما لم يكن `params.think` أو `params.thinking` مهيأً
    صراحةً؛ وترسل `/think low|medium|high` سلسلة مستوى الجهد المطابقة؛ بينما
    تُطابق `/think max` أعلى مستوى جهد في Ollama، وهو `think: "high"`.

    <Tip>
    لاستخدام نقطة النهاية المتوافقة مع OpenAI بدلًا من ذلك، راجع «وضع التوافق القديم مع OpenAI» أعلاه — فقد لا يعمل البث واستدعاء الأدوات معًا فيها.
    </Tip>

  </Accordion>
</AccordionGroup>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="WSL2 crash loop (repeated reboots)">
    في WSL2 مع NVIDIA/CUDA، ينشئ مُثبّت Ollama الرسمي لنظام Linux وحدة
    systemd باسم `ollama.service` تحتوي على `Restart=always`. إذا بدأت هذه
    الخدمة تلقائيًا وحمّلت نموذجًا مدعومًا بوحدة معالجة رسومية أثناء إقلاع
    WSL2، فقد يحجز Ollama ذاكرة المضيف أثناء التحميل؛ ولا تستطيع آلية استرداد
    الذاكرة في Hyper-V دائمًا استعادة تلك الصفحات، مما قد يدفع Windows إلى
    إنهاء آلة WSL2 الافتراضية، ثم يعيد systemd تشغيل Ollama، وتتكرر الحلقة.

    الدليل: عمليات إعادة تشغيل أو إنهاء متكررة لـ WSL2، واستخدام مرتفع لوحدة
    المعالجة المركزية في `app.slice` أو `ollama.service` مباشرةً بعد بدء
    WSL2، وإشارة SIGTERM من systemd بدلًا من أداة إنهاء العمليات عند نفاد
    الذاكرة في Linux.

    يسجّل OpenClaw تحذيرًا عند بدء التشغيل عندما يكتشف WSL2، وأن
    `ollama.service` مفعّلة مع `Restart=always`، ووجود مؤشرات CUDA ظاهرة.

    الإجراء التخفيفي:

    ```bash
    sudo systemctl disable ollama
    ```

    على جانب Windows، أضف ما يلي إلى `%USERPROFILE%\.wslconfig`، ثم شغّل
    `wsl --shutdown`:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    أو قلّل مدة إبقاء النموذج نشطًا، أو ابدأ Ollama يدويًا عند الحاجة فقط:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    راجع [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317).

  </Accordion>

  <Accordion title="Ollama not detected">
    تأكد من أن Ollama قيد التشغيل، وأن `OLLAMA_API_KEY` (أو ملف تعريف
    للمصادقة) مضبوط، وأن `models.providers.ollama` **غير** معرّف صراحةً:

    ```bash
    ollama serve
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="No models available">
    اسحب النموذج محليًا، أو عرّفه صراحةً في
    `models.providers.ollama`:

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="Connection refused">
    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="Remote host works with curl but not OpenClaw">
    تحقّق من الجهاز وبيئة التشغيل نفسيهما اللذين يشغّلان Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    الأسباب الشائعة:

    - يشير `baseUrl` إلى `localhost`، لكن Gateway يعمل داخل Docker أو على مضيف آخر.
    - يستخدم عنوان URL المسار `/v1`، مما يحدد السلوك المتوافق مع OpenAI بدلًا من سلوك Ollama الأصلي.
    - يحتاج المضيف البعيد إلى تغييرات في جدار الحماية أو الربط بالشبكة المحلية.
    - يوجد النموذج في الخدمة الخفية على حاسوبك المحمول، لكنه غير موجود في الخدمة البعيدة.

  </Accordion>

  <Accordion title="Model outputs tool JSON as text">
    يكون الموفّر عادةً في وضع التوافق مع OpenAI، أو لا يستطيع النموذج
    معالجة مخططات الأدوات. يُفضّل استخدام الوضع الأصلي:

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

    إذا استمر فشل نموذج محلي صغير في معالجة مخططات الأدوات، فاضبط
    `compat.supportsTools: false` في إدخال ذلك النموذج وأعد الاختبار.

  </Accordion>

  <Accordion title="Kimi or GLM returns garbled symbols">
    تُعامل استجابات Kimi/GLM المستضافة التي تتكون من سلاسل طويلة من الرموز
    غير اللغوية على أنها استدعاء فاشل للموفّر بدلًا من رد ناجح، بحيث تتولى
    آليات إعادة المحاولة أو الانتقال الاحتياطي أو معالجة الأخطاء المعتادة
    المهمة بدلًا من حفظ نص تالف في الجلسة.

    إذا تكرر ذلك، فالتقط اسم النموذج وملف الجلسة الحالي وما إذا كان التشغيل
    يستخدم `Cloud + Local` أو `Cloud only`، ثم جرّب جلسة جديدة ونموذجًا
    احتياطيًا:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="Cold local model times out">
    قد تحتاج النماذج المحلية الكبيرة إلى وقت طويل في التحميل الأول. اجعل
    نطاق المهلة مقتصرًا على موفّر Ollama، ويمكنك اختياريًا إبقاء النموذج
    محمّلًا بين التفاعلات:

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
    تمدد أيضًا مهلة الاتصال المحمية لهذا الموفّر.

  </Accordion>

  <Accordion title="Large-context model is too slow or runs out of memory">
    تعلن نماذج كثيرة عن سياقات أكبر مما يمكن لعتادك تشغيله بصورة مريحة.
    يستخدم Ollama الأصلي قيمة وقت التشغيل الافتراضية الخاصة به ما لم يُضبط
    `params.num_ctx`. ضع حدًا لكل من ميزانية OpenClaw وسياق طلب Ollama
    للحصول على زمن وصول متوقع لأول رمز:

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

    خفّض `contextWindow` إذا كان OpenClaw يرسل موجّهًا أكبر من اللازم.
    وخفّض `params.num_ctx` إذا كان سياق وقت تشغيل Ollama أكبر مما يستطيع
    الجهاز تحمّله. وخفّض `maxTokens` إذا استغرق التوليد وقتًا طويلًا جدًا.

  </Accordion>
</AccordionGroup>

<Note>
مزيد من المساعدة: [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) و[الأسئلة الشائعة](/ar/help/faq).
</Note>

## ذو صلة

<CardGroup cols={2}>
  <Card title="Ollama Cloud" href="/ar/providers/ollama-cloud" icon="cloud">
    إعداد سحابي فقط باستخدام الموفّر المخصص `ollama-cloud`.
  </Card>
  <Card title="Model providers" href="/ar/concepts/model-providers" icon="layers">
    نظرة عامة على جميع الموفّرين ومراجع النماذج وسلوك الانتقال الاحتياطي.
  </Card>
  <Card title="Model selection" href="/ar/concepts/models" icon="brain">
    كيفية اختيار النماذج وتهيئتها.
  </Card>
  <Card title="Ollama Web Search" href="/ar/tools/ollama-search" icon="magnifying-glass">
    تفاصيل الإعداد والسلوك الكاملة لبحث الويب المدعوم من Ollama.
  </Card>
  <Card title="Configuration" href="/ar/gateway/configuration" icon="gear">
    مرجع الإعداد الكامل.
  </Card>
</CardGroup>
