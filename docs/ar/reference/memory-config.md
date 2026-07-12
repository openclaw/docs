---
read_when:
    - تريد تكوين موفّري البحث في الذاكرة أو نماذج التضمين
    - تريد إعداد الواجهة الخلفية لـ QMD
    - تريد ضبط البحث الهجين أو MMR أو التلاشي الزمني
    - تريد تمكين فهرسة الذاكرة متعددة الوسائط
sidebarTitle: Memory config
summary: جميع خيارات التكوين للبحث في الذاكرة، وموفّري التضمينات، وQMD، والبحث الهجين، والفهرسة متعددة الوسائط
title: مرجع إعدادات الذاكرة
x-i18n:
    generated_at: "2026-07-12T06:31:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 558995797a5e217e57245e1d5ff90124fca67b6eb4767d97a3ea26a4ca013d06
    source_path: reference/memory-config.md
    workflow: 16
---

تسرد هذه الصفحة جميع خيارات التكوين الخاصة ببحث ذاكرة OpenClaw. للاطلاع على نظرات عامة مفاهيمية، راجع:

<CardGroup cols={2}>
  <Card title="نظرة عامة على الذاكرة" href="/ar/concepts/memory">
    كيفية عمل الذاكرة.
  </Card>
  <Card title="المحرك المضمّن" href="/ar/concepts/memory-builtin">
    الواجهة الخلفية الافتراضية المستندة إلى SQLite.
  </Card>
  <Card title="محرك QMD" href="/ar/concepts/memory-qmd">
    عملية جانبية تعطي الأولوية للتشغيل المحلي.
  </Card>
  <Card title="بحث الذاكرة" href="/ar/concepts/memory-search">
    مسار البحث وضبطه.
  </Card>
  <Card title="Active Memory" href="/ar/concepts/active-memory">
    وكيل فرعي للذاكرة مخصص للجلسات التفاعلية.
  </Card>
</CardGroup>

توجد جميع إعدادات بحث الذاكرة ضمن `agents.defaults.memorySearch` في `openclaw.json` (أو في تجاوز خاص بكل وكيل ضمن `agents.list[].memorySearch`) ما لم يُذكر خلاف ذلك.

<Note>
إذا كنت تبحث عن مفتاح تبديل ميزة **Active Memory** وتكوين الوكيل الفرعي، فستجده ضمن `plugins.entries.active-memory` بدلًا من `memorySearch`.

تستخدم Active Memory نموذجًا ذا بوابتين:

1. يجب تمكين Plugin واستهداف معرّف الوكيل الحالي
2. يجب أن يكون الطلب جلسة محادثة تفاعلية مستمرة مؤهلة

راجع [Active Memory](/ar/concepts/active-memory) للتعرف على نموذج التنشيط، والتكوين المملوك للـ Plugin، واستمرارية نص المحادثة، ونمط الطرح الآمن.
</Note>

---

## اختيار المزوّد

| المفتاح    | النوع     | القيمة الافتراضية | الوصف                                                                                                                                                                                                                                                                                       |
| ---------- | --------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`  | `boolean` | `true`            | تمكين بحث الذاكرة أو تعطيله                                                                                                                                                                                                                                                                 |
| `provider` | `string`  | `"openai"`        | معرّف محوّل التضمين، مثل `bedrock` أو `deepinfra` أو `gemini` أو `github-copilot` أو `local` أو `mistral` أو `ollama` أو `openai` أو `openai-compatible` أو `voyage`؛ ويمكن أيضًا أن يكون `models.providers.<id>` مكوّنًا يشير `api` فيه إلى محوّل تضمين للذاكرة أو واجهة API لنموذج متوافق مع OpenAI |
| `model`    | `string`  | افتراضي المزوّد   | اسم نموذج التضمين                                                                                                                                                                                                                                                                            |
| `fallback` | `string`  | `"none"`          | معرّف المحوّل الاحتياطي عند فشل المحوّل الأساسي                                                                                                                                                                                                                                             |

عندما لا تُضبط قيمة `provider`، يستخدم OpenClaw تضمينات OpenAI. اضبط `provider`
صراحةً لاستخدام Bedrock أو DeepInfra أو Gemini أو GitHub Copilot أو Mistral أو Ollama أو
Voyage أو نموذج GGUF محلي أو نقطة نهاية `/v1/embeddings` متوافقة مع OpenAI.
تُحوَّل التكوينات القديمة التي لا تزال تحتوي على `provider: "auto"` إلى `openai`.

<Warning>
قد يؤدي تغيير مزوّد التضمين أو النموذج أو إعدادات المزوّد أو المصادر أو النطاق أو
التقسيم إلى مقاطع أو أداة الترميز إلى جعل فهرس متجهات SQLite الحالي غير متوافق.
يوقف OpenClaw البحث المتجهي مؤقتًا ويُبلغ عن تحذير بشأن هوية الفهرس بدلًا من
إعادة تضمين كل شيء تلقائيًا. أعد بناء الفهرس عندما تكون مستعدًا باستخدام
`openclaw memory status --index --agent <id>` أو
`openclaw memory index --force --agent <id>`.
</Warning>

عندما تكون `provider` غير مضبوطة، أو يكون الإعداد القديم `provider: "auto"` موجودًا، أو
تحدد `provider: "none"` عمدًا وضع FTS فقط، يظل بإمكان استرجاع الذاكرة
استخدام ترتيب FTS المعجمي عندما لا تكون التضمينات متاحة.

تفشل المزوّدات غير المحلية المحددة صراحةً بطريقة مغلقة. إذا ضبطت `memorySearch.provider` على
مزوّد محدد مدعوم عن بُعد، مثل Bedrock أو DeepInfra أو Gemini أو GitHub
Copilot أو LM Studio أو Mistral أو Ollama أو OpenAI أو Voyage، أو مزوّد مخصص
متوافق مع OpenAI، ولم يكن ذلك المزوّد متاحًا في وقت التشغيل، فستُرجع `memory_search`
نتيجة تفيد بعدم التوفر بدلًا من استخدام استرجاع FTS فقط بصمت. أصلح
تكوين المزوّد/المصادقة، أو انتقل إلى مزوّد يمكن الوصول إليه، أو اضبط
`provider: "none"` إذا كنت تريد استرجاعًا مقصودًا باستخدام FTS فقط.

### معرّفات المزوّدين المخصصة

يمكن أن يشير `memorySearch.provider` إلى إدخال مخصص في `models.providers.<id>` لمحوّلات المزوّد الخاصة بالذاكرة، مثل `ollama`، أو لواجهات API لنماذج متوافقة مع OpenAI، مثل `openai-responses` / `openai-completions`. يحل OpenClaw مالك `api` لذلك المزوّد لاستخدامه كمحوّل تضمين، مع الاحتفاظ بمعرّف المزوّد المخصص لمعالجة نقطة النهاية والمصادقة وبادئة النموذج. يتيح ذلك للإعدادات متعددة وحدات معالجة الرسومات أو متعددة المضيفين تخصيص تضمينات الذاكرة لنقطة نهاية محلية محددة:

```json5
{
  models: {
    providers: {
      "ollama-5080": {
        api: "ollama",
        baseUrl: "http://gpu-box.local:11435",
        apiKey: "ollama-local",
        models: [{ id: "qwen3-embedding:0.6b", name: "Qwen3 Embedding 0.6B" }],
      },
    },
  },
  agents: {
    defaults: {
      memorySearch: {
        provider: "ollama-5080",
        model: "qwen3-embedding:0.6b",
      },
    },
  },
}
```

### تحديد مفتاح API

تتطلب التضمينات البعيدة مفتاح API. ويستخدم Bedrock بدلًا من ذلك سلسلة بيانات الاعتماد الافتراضية لـ AWS SDK (أدوار المثيلات أو SSO أو مفاتيح الوصول أو مفتاح API لـ Bedrock).

| المزوّد        | متغير البيئة                                        | مفتاح التكوين                       |
| -------------- | --------------------------------------------------- | ----------------------------------- |
| Bedrock        | سلسلة بيانات اعتماد AWS، أو `AWS_BEARER_TOKEN_BEDROCK` | لا حاجة إلى مفتاح API               |
| DeepInfra      | `DEEPINFRA_API_KEY`                                 | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                    | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN`  | ملف تعريف المصادقة عبر تسجيل دخول الجهاز |
| Mistral        | `MISTRAL_API_KEY`                                   | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (قيمة نائبة)                       | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                    | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                    | `models.providers.voyage.apiKey`    |

<Note>
تغطي مصادقة Codex عبر OAuth المحادثة/الإكمالات فقط، ولا تفي بطلبات التضمين.
</Note>

---

## تكوين نقطة النهاية البعيدة

استخدم `provider: "openai-compatible"` لخادم `/v1/embeddings` عام
متوافق مع OpenAI لا ينبغي أن يرث بيانات اعتماد محادثة OpenAI العامة.

<ParamField path="remote.baseUrl" type="string">
  عنوان URL أساسي مخصص لواجهة API.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  تجاوز مفتاح API.
</ParamField>
<ParamField path="remote.headers" type="object">
  ترويسات HTTP إضافية (تُدمج مع الإعدادات الافتراضية للمزوّد).
</ParamField>

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai-compatible",
        model: "text-embedding-3-small",
        remote: {
          baseUrl: "https://api.example.com/v1/",
          apiKey: "YOUR_KEY",
        },
      },
    },
  },
}
```

---

## التكوين الخاص بكل مزوّد

<AccordionGroup>
  <Accordion title="Gemini">
    | المفتاح               | النوع    | القيمة الافتراضية       | الوصف                                     |
    | --------------------- | -------- | ----------------------- | ----------------------------------------- |
    | `model`               | `string` | `gemini-embedding-001`  | يدعم أيضًا `gemini-embedding-2-preview`   |
    | `outputDimensionality`| `number` | `3072`                  | بالنسبة إلى Embedding 2: ‏768 أو 1536 أو 3072 |

    <Warning>
    يؤدي تغيير النموذج أو `outputDimensionality` إلى تغيير هوية الفهرس. يوقف OpenClaw
    البحث المتجهي مؤقتًا إلى أن تعيد بناء فهرس الذاكرة صراحةً.
    </Warning>

  </Accordion>
  <Accordion title="أنواع الإدخال المتوافقة مع OpenAI">
    يمكن لنقاط نهاية التضمين المتوافقة مع OpenAI الاشتراك في حقول طلب `input_type` الخاصة بالمزوّد. يفيد ذلك نماذج التضمين غير المتماثلة التي تتطلب تسميات مختلفة لتضمينات الاستعلام والمستند.

    | المفتاح              | النوع    | القيمة الافتراضية | الوصف                                              |
    | -------------------- | -------- | ----------------- | -------------------------------------------------- |
    | `inputType`          | `string` | غير مضبوط         | `input_type` مشترك لتضمينات الاستعلام والمستند    |
    | `queryInputType`     | `string` | غير مضبوط         | `input_type` وقت الاستعلام؛ يتجاوز `inputType`    |
    | `documentInputType`  | `string` | غير مضبوط         | `input_type` للفهرس/المستند؛ يتجاوز `inputType`   |

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "openai-compatible",
            remote: {
              baseUrl: "https://embeddings.example/v1",
              apiKey: "${EMBEDDINGS_API_KEY}",
            },
            model: "asymmetric-embedder",
            queryInputType: "query",
            documentInputType: "passage",
          },
        },
      },
    }
    ```

    يؤثر تغيير هذه القيم في هوية ذاكرة التخزين المؤقت للتضمينات عند فهرسة الدفعات لدى المزوّد، وينبغي أن تتبعه إعادة فهرسة للذاكرة عندما يتعامل النموذج المصدر مع التسميات بشكل مختلف.

  </Accordion>
  <Accordion title="Bedrock">
    ### تكوين تضمين Bedrock

    يستخدم Bedrock سلسلة بيانات الاعتماد الافتراضية لـ AWS SDK بالإضافة إلى رمز حامل يتحقق منه OpenClaw، ولذلك لا تُخزَّن مفاتيح API في التكوين. إذا كان OpenClaw يعمل على EC2 باستخدام دور مثيل مُمكّن لـ Bedrock، فما عليك سوى ضبط المزوّد والنموذج:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0",
          },
        },
      },
    }
    ```

    | المفتاح               | النوع    | القيمة الافتراضية               | الوصف                               |
    | --------------------- | -------- | -------------------------------- | ----------------------------------- |
    | `model`               | `string` | `amazon.titan-embed-text-v2:0`   | أي معرّف لنموذج تضمين Bedrock       |
    | `outputDimensionality`| `number` | القيمة الافتراضية للنموذج        | بالنسبة إلى Titan V2: ‏256 أو 512 أو 1024 |

    **النماذج المدعومة** (مع اكتشاف العائلة والقيم الافتراضية للأبعاد):

    | معرّف النموذج                                 | المزوّد     | الأبعاد الافتراضية | الأبعاد القابلة للتهيئة        |
    | ------------------------------------------- | ------------ | ------------------ | ------------------------------ |
    | `amazon.titan-embed-text-v2:0`             | Amazon       | 1024               | 256, 512, 1024                 |
    | `amazon.titan-embed-text-v1`               | Amazon       | 1536               | --                             |
    | `amazon.titan-embed-g1-text-02`            | Amazon       | 1536               | --                             |
    | `amazon.titan-embed-image-v1`              | Amazon       | 1024               | --                             |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon       | 1024               | 256, 384, 1024, 3072           |
    | `cohere.embed-english-v3`                  | Cohere       | 1024               | --                             |
    | `cohere.embed-multilingual-v3`             | Cohere       | 1024               | --                             |
    | `cohere.embed-v4:0`                        | Cohere       | 1536               | 256, 384, 512, 768, 1024, 1536 |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs   | 512                | --                             |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs   | 1024               | --                             |

    ترث الصيغ ذات لاحقة معدل النقل (مثل `amazon.titan-embed-text-v1:2:8k`) ومعرّفات ملفات تعريف الاستدلال ذات بادئة المنطقة (مثل `us.amazon.titan-embed-text-v2:0`) تهيئة النموذج الأساسي.

    **المنطقة:** تُحدَّد بهذا الترتيب: تجاوز `memorySearch.remote.baseUrl`، ثم تهيئة `models.providers.amazon-bedrock.baseUrl`، ثم `AWS_REGION`، ثم `AWS_DEFAULT_REGION`، وأخيرًا القيمة الافتراضية `us-east-1`.

    **المصادقة:** يتحقق OpenClaw أولًا من وجود `AWS_ACCESS_KEY_ID` مع `AWS_SECRET_ACCESS_KEY` أو `AWS_BEARER_TOKEN_BEDROCK`، ثم ينتقل إلى سلسلة موفّر بيانات الاعتماد الافتراضية القياسية في AWS SDK:

    1. متغيرات البيئة (`AWS_ACCESS_KEY_ID` مع `AWS_SECRET_ACCESS_KEY`)، ما لم يكن `AWS_PROFILE` مضبوطًا أيضًا
    2. تسجيل الدخول الأحادي (فقط عند تهيئة حقول تسجيل الدخول الأحادي)
    3. ملفات بيانات الاعتماد والتهيئة المشتركة (`fromIni`، وتشمل `AWS_PROFILE`)
    4. عملية بيانات الاعتماد (`credential_process` في ملف تهيئة AWS)
    5. بيانات اعتماد رمز هوية الويب
    6. بيانات اعتماد بيانات تعريف مثيل ECS أو EC2

    **أذونات IAM:** يحتاج دور IAM أو المستخدم إلى:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    لتحقيق مبدأ الحد الأدنى من الامتيازات، احصر `InvokeModel` في النموذج المحدد:

    ```text
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="محلي (GGUF + llama.cpp)">
    | المفتاح               | النوع              | القيمة الافتراضية       | الوصف                                                                                                                                                                                                                                                                                                                       |
    | --------------------- | ------------------ | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | يُنزَّل تلقائيًا        | مسار ملف نموذج GGUF                                                                                                                                                                                                                                                                                                         |
    | `local.modelCacheDir` | `string`           | افتراضي node-llama-cpp  | دليل التخزين المؤقت للنماذج المنزّلة                                                                                                                                                                                                                                                                                        |
    | `local.contextSize`   | `number \| "auto"` | `4096`                  | حجم نافذة السياق لسياق التضمين. تغطي القيمة 4096 المقاطع المعتادة (128-512 رمزًا) مع تقييد ذاكرة VRAM غير المخصصة للأوزان. اخفضها إلى 1024-2048 على المضيفين محدودي الموارد. تستخدم `"auto"` الحد الأقصى الذي دُرِّب عليه النموذج، ولا يُنصح بها لنماذج 8B فأكبر (Qwen3-Embedding-8B: قد يؤدي استخدام ما يصل إلى 40 960 رمزًا إلى رفع استهلاك VRAM إلى نحو 32 GB). |

    ثبّت موفّر llama.cpp الرسمي أولًا: `openclaw plugins install @openclaw/llama-cpp-provider`.
    النموذج الافتراضي: `embeddinggemma-300m-qat-Q8_0.gguf` (نحو 0.6 GB، يُنزَّل تلقائيًا). لا تزال نسخ الشفرة المصدرية تتطلب الموافقة على البناء الأصلي: `pnpm approve-builds` ثم `pnpm rebuild node-llama-cpp`.

    استخدم CLI المستقل للتحقق من مسار الموفّر نفسه الذي يستخدمه Gateway:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    تُستخدم قيم `local.contextSize` الرقمية أيضًا لإرشاد node-llama-cpp في التوزيع التلقائي لطبقات GPU، بحيث تُلائم أوزان النموذج وسياق التضمين المطلوب معًا. يعرض `openclaw memory status --deep` آخر معلومات معروفة ومؤرخة زمنيًا عن الواجهة الخلفية لـ llama.cpp والجهاز والتفريغ والسياق المطلوب والذاكرة، بعد أن يحمّل وقت التشغيل النموذج؛ ولا تؤدي حالة المراقبة السلبية إلى تحميل نموذج.

    اضبط `provider: "local"` صراحةً لاستخدام تضمينات GGUF المحلية. تُدعم مراجع النماذج `hf:` وHTTP(S) في التهيئات المحلية الصريحة (عبر آلية حل النماذج في node-llama-cpp)، لكنها لا تغيّر الموفّر الافتراضي.

  </Accordion>
</AccordionGroup>

### مهلة التضمين المضمّن

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  تجاوز مهلة دفعات التضمين المضمّنة أثناء فهرسة الذاكرة.

عند عدم الضبط، تُستخدم القيمة الافتراضية للموفّر: 600 ثانية للموفّرين المحليين أو المستضافين ذاتيًا مثل `local` و`ollama` و`lmstudio`، و120 ثانية للموفّرين المستضافين. زِد هذه القيمة عندما تكون دفعات التضمين المحلية المعتمدة على CPU سليمة لكنها بطيئة.
</ParamField>

---

## سلوك الفهرسة

تقع جميع الإعدادات ضمن `memorySearch.sync` ما لم يُذكر خلاف ذلك:

| المفتاح                        | النوع     | القيمة الافتراضية | الوصف                                                                    |
| ------------------------------ | --------- | ----------------- | ------------------------------------------------------------------------ |
| `onSessionStart`               | `boolean` | `true`            | مزامنة فهرس الذاكرة عند بدء جلسة                                         |
| `onSearch`                     | `boolean` | `true`            | المزامنة الكسولة عند البحث بعد اكتشاف تغييرات في المحتوى                 |
| `watch`                        | `boolean` | `true`            | مراقبة ملفات الذاكرة (chokidar) وجدولة إعادة الفهرسة عند حدوث تغييرات    |
| `watchDebounceMs`              | `number`  | `1500`            | نافذة إزالة الارتداد لدمج أحداث مراقبة الملفات المتتابعة بسرعة           |
| `intervalMinutes`              | `number`  | `0`               | الفاصل الدوري لإعادة الفهرسة بالدقائق (`0` يعطّلها)                      |
| `sessions.postCompactionForce` | `boolean` | `true`            | فرض إعادة فهرسة الجلسة بعد تحديثات النص الناتجة عن Compaction            |

<ParamField path="chunking.tokens" type="number">
  حجم المقطع بالرموز المميزة المستخدم عند تقسيم مصادر الذاكرة قبل التضمين (الافتراضي: 400).
</ParamField>
<ParamField path="chunking.overlap" type="number">
  تداخل الرموز المميزة بين المقاطع المتجاورة للحفاظ على السياق بالقرب من حدود التقسيم (الافتراضي: 80).
</ParamField>

<Note>
يؤدي تغيير `chunking.tokens` أو `chunking.overlap` إلى تغيير حدود المقاطع وإبطال هوية الفهرس الحالية (راجع التحذير ضمن اختيار المزوّد).
</Note>

---

## إعداد البحث الهجين

جميع ما يلي ضمن `memorySearch.query`:

| المفتاح      | النوع    | الافتراضي | الوصف                                              |
| ------------ | -------- | --------- | -------------------------------------------------- |
| `maxResults` | `number` | `6`       | أقصى عدد من نتائج الذاكرة المُعادة قبل الحقن       |
| `minScore`   | `number` | `0.35`    | الحد الأدنى لدرجة الصلة اللازمة لتضمين نتيجة       |

وما يلي ضمن `memorySearch.query.hybrid`:

| المفتاح              | النوع     | الافتراضي | الوصف                                  |
| -------------------- | --------- | --------- | -------------------------------------- |
| `enabled`            | `boolean` | `true`    | تمكين البحث الهجين باستخدام BM25 والمتجهات |
| `vectorWeight`       | `number`  | `0.7`     | وزن درجات المتجهات (0-1)              |
| `textWeight`         | `number`  | `0.3`     | وزن درجات BM25 ‏(0-1)                  |
| `candidateMultiplier` | `number` | `4`       | مُضاعِف حجم مجموعة المرشحين            |

<Tabs>
  <Tab title="MMR (التنوع)">
    | المفتاح      | النوع     | الافتراضي | الوصف                                      |
    | ------------ | --------- | --------- | ------------------------------------------ |
    | `mmr.enabled` | `boolean` | `false`   | تمكين إعادة الترتيب باستخدام MMR          |
    | `mmr.lambda`  | `number`  | `0.7`     | 0 = أقصى تنوع، 1 = أقصى صلة               |
  </Tab>
  <Tab title="التضاؤل الزمني (الحداثة)">
    | المفتاح                     | النوع     | الافتراضي | الوصف                              |
    | --------------------------- | --------- | --------- | ---------------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false`   | تمكين تعزيز النتائج الأحدث         |
    | `temporalDecay.halfLifeDays` | `number`  | `30`      | تنخفض الدرجة إلى النصف كل N يومًا  |

    لا تخضع الملفات دائمة الصلاحية (`MEMORY.md` والملفات غير المؤرخة في `memory/`) للتضاؤل مطلقًا.

  </Tab>
</Tabs>

### مثال كامل

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
          maxResults: 6,
          minScore: 0.35,
          hybrid: {
            vectorWeight: 0.7,
            textWeight: 0.3,
            mmr: { enabled: true, lambda: 0.7 },
            temporalDecay: { enabled: true, halfLifeDays: 30 },
          },
        },
      },
    },
  },
}
```

---

## مسارات ذاكرة إضافية

| المفتاح     | النوع      | الوصف                                |
| ----------- | ---------- | ------------------------------------ |
| `extraPaths` | `string[]` | أدلة أو ملفات إضافية لفهرستها       |

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        extraPaths: ["../team-docs", "/srv/shared-notes"],
      },
    },
  },
}
```

يمكن أن تكون المسارات مطلقة أو نسبية إلى مساحة العمل. تُفحص الأدلة تكراريًا بحثًا عن ملفات `.md`. تعتمد معالجة الروابط الرمزية على الواجهة الخلفية النشطة: يتخطى المحرك المضمّن الروابط الرمزية، بينما يتبع QMD سلوك الماسح الأساسي الخاص به.

للبحث في نصوص المحادثات بين الوكلاء ضمن نطاق وكيل، استخدم `agents.list[].memorySearch.qmd.extraCollections` بدلًا من `memory.qmd.paths`. تتبع هذه المجموعات الإضافية البنية نفسها `{ path, name, pattern? }`، لكنها تُدمج لكل وكيل ويمكنها الاحتفاظ بأسماء مشتركة صريحة عندما يشير المسار إلى خارج مساحة العمل الحالية. إذا ظهر المسار المحلول نفسه في كل من `memory.qmd.paths` و`memorySearch.qmd.extraCollections`، يحتفظ QMD بالإدخال الأول ويتخطى التكرار.

---

## الذاكرة متعددة الوسائط (Gemini)

فهرس الصور والصوت إلى جانب Markdown باستخدام Gemini Embedding 2:

| المفتاح                  | النوع      | الافتراضي | الوصف                                      |
| ------------------------ | ---------- | ---------- | ------------------------------------------ |
| `multimodal.enabled`      | `boolean`  | `false`    | تمكين الفهرسة متعددة الوسائط               |
| `multimodal.modalities`   | `string[]` | --         | `["image"]` أو `["audio"]` أو `["all"]`    |
| `multimodal.maxFileBytes` | `number`   | `10485760` | أقصى حجم ملف للفهرسة (10 MiB)              |

<Note>
ينطبق فقط على الملفات الموجودة في `extraPaths`. تظل جذور الذاكرة الافتراضية مقتصرة على Markdown. يتطلب `gemini-embedding-2-preview`. يجب أن تكون قيمة `fallback` هي `"none"`.
</Note>

التنسيقات المدعومة: `.jpg`، `.jpeg`، `.png`، `.webp`، `.gif`، `.heic`، `.heif` (صور)؛ `.mp3`، `.wav`، `.ogg`، `.opus`، `.m4a`، `.aac`، `.flac` (صوت).

---

## ذاكرة التخزين المؤقت للتضمينات

| المفتاح            | النوع     | القيمة الافتراضية | الوصف                                           |
| ------------------ | --------- | ----------------- | ----------------------------------------------- |
| `cache.enabled`    | `boolean` | `true`            | تخزين تضمينات المقاطع مؤقتًا في SQLite          |
| `cache.maxEntries` | `number`  | غير معيّن         | حد أعلى تقريبي لعدد التضمينات المخزنة مؤقتًا    |

يمنع إعادة تضمين النص غير المتغير أثناء إعادة الفهرسة أو تحديثات النصوص المنسوخة. اترك `maxEntries` غير معيّن للحصول على ذاكرة تخزين مؤقت غير محدودة؛ وعيّنه عندما يكون نمو مساحة القرص أهم من أقصى سرعة لإعادة الفهرسة. عند تعيينه، تُحذف الإدخالات الأقدم أولًا (حسب وقت آخر تحديث) بمجرد تجاوز ذاكرة التخزين المؤقت للحد.

---

## الفهرسة الدفعية

| المفتاح                       | النوع     | القيمة الافتراضية | الوصف                              |
| ----------------------------- | --------- | ----------------- | ---------------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`               | تضمينات مباشرة متوازية             |
| `remote.batch.enabled`        | `boolean` | `false`           | تفعيل واجهة API للتضمين الدفعي      |
| `remote.batch.concurrency`    | `number`  | `2`               | مهام دفعية متوازية                  |
| `remote.batch.wait`           | `boolean` | `true`            | انتظار اكتمال الدفعة                |
| `remote.batch.pollIntervalMs` | `number`  | `2000`            | الفاصل الزمني للاستقصاء             |
| `remote.batch.timeoutMinutes` | `number`  | `60`              | مهلة الدفعة                          |

متاحة لـ `gemini` و`openai` و`voyage`. عادةً ما تكون المعالجة الدفعية في OpenAI الأسرع والأقل تكلفة لعمليات الملء اللاحقة الكبيرة.

يتحكم `remote.nonBatchConcurrency` في استدعاءات التضمين المباشرة التي تستخدمها المزوّدات المحلية أو ذاتية الاستضافة، والمزوّدات المستضافة عندما لا تكون واجهات API الدفعية الخاصة بالمزوّد نشطة. يستخدم Ollama القيمة الافتراضية `1` للفهرسة غير الدفعية لتجنب إرهاق المضيفات المحلية الأصغر؛ عيّن قيمة أعلى على الأجهزة الأكبر.

وهذا منفصل عن `sync.embeddingBatchTimeoutSeconds`، الذي يتحكم في مهلة استدعاءات التضمين المباشرة.

---

## البحث في ذاكرة الجلسة (تجريبي)

فهرس النصوص المنسوخة للجلسات واعرضها عبر `memory_search`:

| المفتاح                       | النوع      | القيمة الافتراضية | الوصف                                         |
| ----------------------------- | ---------- | ----------------- | --------------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`           | تفعيل فهرسة الجلسات                            |
| `sources`                     | `string[]` | `["memory"]`      | إضافة `"sessions"` لتضمين النصوص المنسوخة     |
| `sync.sessions.deltaBytes`    | `number`   | `100000`          | حد البايتات لإعادة الفهرسة                     |
| `sync.sessions.deltaMessages` | `number`   | `50`              | حد الرسائل لإعادة الفهرسة                      |

<Warning>
فهرسة الجلسات اختيارية وتعمل بصورة غير متزامنة. قد تكون النتائج قديمة قليلًا. توجد سجلات الجلسات على القرص، لذا تعامل مع الوصول إلى نظام الملفات بوصفه حد الثقة.
</Warning>

تلتزم نتائج النصوص المنسوخة للجلسات أيضًا بإعداد
[`tools.sessions.visibility`](/ar/gateway/config-tools#toolssessions). لا تعرض الرؤية الافتراضية
`tree` سوى الجلسة الحالية والجلسات التي أنشأتها. لاسترجاع جلسة غير مرتبطة للمساعد نفسه، أرسلها Gateway من جلسة
مختلفة، مثل رسالة خاصة، وسّع الرؤية عمدًا إلى `agent` (أو إلى `all` فقط
عندما يكون الاسترجاع بين المساعدين مطلوبًا أيضًا وتسمح به سياسة التواصل بين المساعدين).

تضع الأمثلة أدناه هذه الإعدادات ضمن `agents.defaults`. ويمكنك أيضًا
تطبيق إعدادات `memorySearch` مكافئة في تجاوز خاص بكل مساعد عندما ينبغي لمساعد
واحد فقط فهرسة النصوص المنسوخة للجلسات والبحث فيها.

للاسترجاع من Gateway إلى الرسائل الخاصة للمساعد نفسه:

<Tabs>
  <Tab title="الواجهة الخلفية المضمّنة">
    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            experimental: { sessionMemory: true },
            sources: ["memory", "sessions"],
          },
        },
      },
      tools: {
        sessions: { visibility: "agent" },
      },
    }
    ```
  </Tab>
  <Tab title="واجهة QMD الخلفية">
    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            experimental: { sessionMemory: true },
            sources: ["memory", "sessions"],
          },
        },
      },
      memory: {
        backend: "qmd",
        qmd: {
          sessions: { enabled: true },
        },
      },
      tools: {
        sessions: { visibility: "agent" },
      },
    }
    ```
  </Tab>
</Tabs>

عند استخدام QMD، لا يؤدي `agents.defaults.memorySearch.experimental.sessionMemory` و
`sources: ["sessions"]` بمفردهما إلى تصدير النصوص المنسوخة إلى QMD. عيّن
`memory.qmd.sessions.enabled: true` أيضًا.

---

  ## تسريع المتجهات في SQLite ‏(sqlite-vec)

  | المفتاح                      | النوع     | القيمة الافتراضية | الوصف                              |
  | ---------------------------- | --------- | ------------------ | ---------------------------------- |
  | `store.vector.enabled`       | `boolean` | `true`             | استخدام sqlite-vec لاستعلامات المتجهات |
  | `store.vector.extensionPath` | `string`  | مضمن               | تجاوز مسار sqlite-vec              |

  عندما لا يتوفر sqlite-vec، يعود OpenClaw تلقائيًا إلى استخدام تشابه جيب التمام داخل العملية.

  ---

  ## تخزين الفهرس

  توجد فهارس الذاكرة المضمنة في قاعدة بيانات OpenClaw SQLite الخاصة بكل وكيل في
  `agents/<agentId>/agent/openclaw-agent.sqlite`.

  | المفتاح               | النوع    | القيمة الافتراضية | الوصف                                      |
  | --------------------- | -------- | ------------------ | ------------------------------------------ |
  | `store.fts.tokenizer` | `string` | `unicode61`        | أداة تقسيم النصوص في FTS5 ‏(`unicode61` أو `trigram`) |

  ---

  ## إعداد الواجهة الخلفية لـ QMD

  عيّن `memory.backend = "qmd"` للتمكين. توجد جميع إعدادات QMD ضمن `memory.qmd`:

  | المفتاح                    | النوع     | القيمة الافتراضية | الوصف                                                                                         |
  | -------------------------- | --------- | ------------------ | --------------------------------------------------------------------------------------------- |
  | `command`                  | `string`  | `qmd`              | مسار ملف QMD التنفيذي؛ عيّن مسارًا مطلقًا عندما يختلف `PATH` الخاص بالخدمة عن الصدفة لديك |
  | `searchMode`               | `string`  | `search`           | أمر البحث: `search`، أو `vsearch`، أو `query`                                                  |
  | `rerank`                   | `boolean` | --                 | عيّنه إلى `false` مع `searchMode: "query"` وQMD 2.1+ لتخطي إعادة الترتيب في QMD                 |
  | `includeDefaultMemory`     | `boolean` | `true`             | فهرسة `MEMORY.md` و`memory/**/*.md` تلقائيًا                                                   |
  | `paths[]`                  | `array`   | --                 | مسارات إضافية: `{ name, path, pattern? }`                                                      |
  | `sessions.enabled`         | `boolean` | `false`            | تصدير نصوص الجلسات إلى QMD                                                                     |
  | `sessions.retentionDays`   | `number`  | --                 | مدة الاحتفاظ بالنصوص                                                                           |
  | `sessions.exportDir`       | `string`  | --                 | دليل التصدير                                                                                    |

  يقتصر `searchMode: "search"` على البحث المعجمي/BM25. لا يشغّل OpenClaw اختبارات جاهزية المتجهات الدلالية أو صيانة تضمينات QMD لهذا الوضع، بما في ذلك أثناء `memory status --deep`؛ ويظل `vsearch` و`query` يتطلبان جاهزية متجهات QMD والتضمينات.

  يغيّر `rerank: false` وضع `query` في QMD فقط، ويتطلب QMD 2.1 أو إصدارًا أحدث. في وضع CLI المباشر، يمرر OpenClaw الخيار `--no-rerank`؛ وفي وضع MCP المدعوم بواسطة mcporter، يمرر `rerank: false` إلى أداة الاستعلام الموحدة في QMD. اتركه دون تعيين لاستخدام سلوك إعادة ترتيب الاستعلامات الافتراضي في QMD.

  يفضّل OpenClaw أشكال المجموعات واستعلامات MCP الحالية في QMD، لكنه يحافظ على عمل إصدارات QMD الأقدم عبر تجربة خيارات أنماط المجموعات المتوافقة وأسماء أدوات MCP الأقدم عند الحاجة. عندما يعلن QMD دعمه لمرشحات مجموعات متعددة، يُبحث في المجموعات ذات المصدر نفسه باستخدام عملية QMD واحدة؛ بينما تحتفظ إصدارات QMD الأقدم بمسار التوافق لكل مجموعة. ويعني المصدر نفسه تجميع مجموعات الذاكرة الدائمة (ملفات الذاكرة الافتراضية بالإضافة إلى المسارات المخصصة) معًا، بينما تظل مجموعات نصوص الجلسات في مجموعة منفصلة، بحيث يظل تنويع المصادر مستفيدًا من كلا المدخلين.

  <Note>
  تبقى تجاوزات نماذج QMD في جانب QMD، وليس في إعداد OpenClaw. إذا احتجت إلى تجاوز نماذج QMD عموميًا، فعيّن متغيرات بيئة مثل `QMD_EMBED_MODEL` و`QMD_RERANK_MODEL` و`QMD_GENERATE_MODEL` في بيئة تشغيل Gateway.
  </Note>

  ### تكامل mcporter

  توجد جميع الإعدادات ضمن `memory.qmd.mcporter`. يوجّه هذا عمليات بحث QMD عبر عفريت MCP طويل العمر تابع لـ `mcporter` بدلًا من إنشاء عملية `qmd` لكل استعلام، مما يقلل عبء البدء البارد للنماذج الأكبر.

  | المفتاح      | النوع     | القيمة الافتراضية | الوصف                                                                            |
  | ------------ | --------- | ------------------ | -------------------------------------------------------------------------------- |
  | `enabled`    | `boolean` | `false`            | توجيه استدعاءات QMD عبر mcporter بدلًا من إنشاء `qmd` لكل طلب                    |
  | `serverName` | `string`  | `qmd`              | اسم خادم mcporter الذي يشغّل `qmd mcp` مع `lifecycle: keep-alive`                 |
  | `startDaemon`| `boolean` | `true`             | تشغيل عفريت mcporter تلقائيًا عندما تكون قيمة `enabled` هي `true`                |

  يتطلب تثبيت `mcporter` ووجوده في PATH، بالإضافة إلى خادم mcporter مُعدّ لتشغيل `qmd mcp`. أبقه معطلًا في الإعدادات المحلية الأبسط، حيث تكون تكلفة إنشاء عملية لكل استعلام مقبولة.

  <AccordionGroup>
  <Accordion title="جدول التحديث">
    | المفتاح                    | النوع     | القيمة الافتراضية | الوصف                                                                  |
    | -------------------------- | --------- | ------------------ | ---------------------------------------------------------------------- |
    | `update.interval`          | `string`  | `5m`               | الفاصل الزمني للتحديث                                                  |
    | `update.debounceMs`        | `number`  | `15000`            | إزالة ارتداد تغييرات الملفات                                          |
    | `update.onBoot`            | `boolean` | `true`             | التحديث عند فتح مدير QMD طويل العمر؛ عيّنه إلى false لتخطي تحديث الإقلاع الفوري |
    | `update.startup`           | `string`  | `off`              | تهيئة QMD اختيارية عند بدء Gateway: ‏`off`، أو `idle`، أو `immediate`   |
    | `update.startupDelayMs`    | `number`  | `120000`           | التأخير قبل تشغيل تحديث `startup: "idle"`                              |
    | `update.waitForBootSync`   | `boolean` | `false`            | حظر فتح المدير حتى يكتمل تحديثه الأولي                                |
    | `update.embedInterval`     | `string`  | `60m`              | وتيرة منفصلة للتضمين                                                   |
    | `update.commandTimeoutMs`  | `number`  | `30000`            | مهلة أوامر صيانة QMD (عرض المجموعات/إضافتها)                           |
    | `update.updateTimeoutMs`   | `number`  | `120000`           | مهلة كل دورة `qmd update`                                              |
    | `update.embedTimeoutMs`    | `number`  | `120000`           | مهلة كل دورة `qmd embed`                                               |
  </Accordion>
  <Accordion title="الحدود">
    | المفتاح                    | النوع    | القيمة الافتراضية | الوصف                              |
    | -------------------------- | -------- | ------------------ | ---------------------------------- |
    | `limits.maxResults`        | `number` | `4`                | الحد الأقصى لنتائج البحث            |
    | `limits.maxSnippetChars`   | `number` | `450`              | تقييد طول المقتطف                   |
    | `limits.maxInjectedChars`  | `number` | `2200`             | تقييد إجمالي المحارف المُحقنة       |
    | `limits.timeoutMs`         | `number` | `4000`             | مهلة البحث                          |
  </Accordion>
  <Accordion title="النطاق">
    يتحكم في الجلسات التي يمكنها تلقي نتائج بحث QMD. يستخدم المخطط نفسه الخاص بـ [`session.sendPolicy`](/ar/gateway/config-agents#session):

    ```json5
    {
      memory: {
        qmd: {
          scope: {
            default: "deny",
            rules: [{ action: "allow", match: { chatType: "direct" } }],
          },
        },
      },
    }
    ```

    تقتصر القيمة الافتراضية المضمنة على الرسائل الخاصة/المباشرة، وتحظر المجموعات وأنواع القنوات الأخرى. يطابق `match.keyPrefix` مفتاح الجلسة الموحّد؛ بينما يطابق `match.rawKeyPrefix` المفتاح الخام بما في ذلك `agent:<id>:`.

  </Accordion>
  <Accordion title="الاستشهادات">
    ينطبق `memory.citations` على جميع الواجهات الخلفية:

    | القيمة            | السلوك                                            |
    | ------------------ | ------------------------------------------------------ |
    | `auto` (الافتراضي) | تضمين التذييل `Source: <path#line>` في المقتطفات    |
    | `on`             | تضمين التذييل دائمًا                               |
    | `off`            | حذف التذييل (مع استمرار تمرير المسار إلى الوكيل داخليًا) |

  </Accordion>
</AccordionGroup>

عند تمكين تهيئة QMD عند بدء Gateway، يشغّل OpenClaw ‏QMD للوكلاء المؤهلين فقط. إذا كانت `update.onBoot` تساوي `true` ولم تُضبط صيانة دورية للتحديث أو التضمين، فسيستخدم بدء التشغيل مديرًا أحادي التنفيذ لإجراء تحديث الإقلاع ثم يغلقه. وإذا ضُبط فاصل زمني للتحديث أو التضمين، فسيفتح بدء التشغيل مدير QMD طويل الأمد ليتولى مراقب التغييرات ومؤقتات الفواصل الزمنية؛ أما `update.onBoot: false` فتتجاوز تحديث الإقلاع الفوري فقط.

### مثال كامل على QMD

```json5
{
  memory: {
    backend: "qmd",
    citations: "auto",
    qmd: {
      includeDefaultMemory: true,
      update: { interval: "5m", debounceMs: 15000 },
      limits: { maxResults: 4, timeoutMs: 4000 },
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

---

## Dreaming

يُضبط Dreaming ضمن `plugins.entries.memory-core.config.dreaming`، وليس ضمن `agents.defaults.memorySearch`.

يعمل Dreaming كعملية مسح مجدولة واحدة، ويستخدم مراحل خفيفة وعميقة وREM داخلية بوصفها تفاصيل تنفيذية.

للاطلاع على السلوك المفاهيمي وأوامر الشرطة المائلة، راجع [Dreaming](/ar/concepts/dreaming).

### إعدادات المستخدم

| المفتاح                                    | النوع      | الافتراضي       | الوصف                                                                                                                      |
| -------------------------------------- | --------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`       | تمكين Dreaming بالكامل أو تعطيله                                                                                              |
| `frequency`                            | `string`  | `0 3 * * *`   | وتيرة Cron اختيارية لعملية المسح الكاملة لـ Dreaming                                                                                |
| `model`                                | `string`  | النموذج الافتراضي | تجاوز اختياري لنموذج الوكيل الفرعي لمذكرات الأحلام                                                                                     |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`         | الحد الأقصى التقديري للرموز المحتفظ بها من كل مقتطف استرجاع قصير الأمد يُرقّى إلى `MEMORY.md`؛ وتظل بيانات تعريف المصدر ظاهرة |

### مثال

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        subagent: {
          allowModelOverride: true,
          allowedModels: ["anthropic/claude-sonnet-4-6"],
        },
        config: {
          dreaming: {
            enabled: true,
            frequency: "0 3 * * *",
            model: "anthropic/claude-sonnet-4-6",
          },
        },
      },
    },
  },
}
```

<Note>
- يكتب Dreaming حالة الآلة في `memory/.dreams/`.
- يكتب Dreaming المخرجات السردية المقروءة للبشر في `DREAMS.md` (أو `dreams.md` الموجود مسبقًا).
- يستخدم `dreaming.model` بوابة الثقة الحالية للوكيل الفرعي في Plugin؛ اضبط `plugins.entries.memory-core.subagent.allowModelOverride: true` قبل تمكينه.
- تعيد مذكرات الأحلام المحاولة مرة واحدة باستخدام النموذج الافتراضي للجلسة عندما لا يكون النموذج المضبوط متاحًا. تُسجل حالات فشل الثقة أو قائمة السماح، ولا تُعاد محاولتها بصمت.
- سياسة مراحل الخفيف والعميق وREM وحدودها سلوك داخلي، وليست إعدادات موجهة للمستخدم.

</Note>

## ذو صلة

- [مرجع الإعدادات](/ar/gateway/configuration-reference)
- [نظرة عامة على الذاكرة](/ar/concepts/memory)
- [البحث في الذاكرة](/ar/concepts/memory-search)
