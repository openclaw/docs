---
read_when:
    - تريد تهيئة موفّري البحث في الذاكرة أو نماذج التضمين
    - تريد إعداد الواجهة الخلفية لـ QMD
    - تريد ضبط البحث الهجين أو MMR أو التلاشي الزمني
    - تريد تمكين فهرسة الذاكرة متعددة الوسائط
sidebarTitle: Memory config
summary: جميع خيارات الضبط للبحث في الذاكرة، وموفّري التضمينات، وQMD، والبحث الهجين، والفهرسة متعددة الوسائط
title: مرجع إعدادات الذاكرة
x-i18n:
    generated_at: "2026-07-16T14:48:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1947d6d654de85059ef777a3a6387f6db5b76c8d688fbb539a063162d323c1f6
    source_path: reference/memory-config.md
    workflow: 16
---

تسرد هذه الصفحة كل إعدادات الضبط الخاصة بالبحث في ذاكرة OpenClaw. للاطلاع على نظرات عامة مفاهيمية، راجع:

<CardGroup cols={2}>
  <Card title="نظرة عامة على الذاكرة" href="/ar/concepts/memory">
    كيفية عمل الذاكرة.
  </Card>
  <Card title="المحرك المضمّن" href="/ar/concepts/memory-builtin">
    واجهة SQLite الخلفية الافتراضية.
  </Card>
  <Card title="محرك QMD" href="/ar/concepts/memory-qmd">
    عملية جانبية محلية أولًا.
  </Card>
  <Card title="البحث في الذاكرة" href="/ar/concepts/memory-search">
    مسار البحث وضبطه.
  </Card>
  <Card title="Active Memory" href="/ar/concepts/active-memory">
    وكيل فرعي للذاكرة مخصص للجلسات التفاعلية.
  </Card>
</CardGroup>

توجد جميع إعدادات البحث في الذاكرة ضمن `agents.defaults.memorySearch` في `openclaw.json` (أو تجاوز `agents.list[].memorySearch` خاص بكل وكيل)، ما لم يُذكر خلاف ذلك.

<Note>
إذا كنت تبحث عن مفتاح تشغيل ميزة **Active Memory** وإعدادات الوكيل الفرعي، فتوجد ضمن `plugins.entries.active-memory` بدلًا من `memorySearch`.

تستخدم Active Memory نموذجًا ذا بوابتين:

1. يجب تمكين الـ plugin واستهداف معرّف الوكيل الحالي
2. يجب أن يكون الطلب جلسة محادثة تفاعلية دائمة مؤهلة

راجع [Active Memory](/ar/concepts/active-memory) للاطلاع على نموذج التفعيل، والإعدادات المملوكة للـ plugin، واستمرارية النص المنسوخ، ونمط الطرح الآمن.
</Note>

---

## اختيار المزوّد

| المفتاح        | النوع      | القيمة الافتراضية          | الوصف                                                                                                                                                                                                                                                                                 |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`  | `boolean` | `true`           | تمكين البحث في الذاكرة أو تعطيله                                                                                                                                                                                                                                                             |
| `provider` | `string`  | `"openai"`       | معرّف محوّل التضمين، مثل `bedrock` أو `deepinfra` أو `gemini` أو `github-copilot` أو `local` أو `mistral` أو `ollama` أو `openai` أو `openai-compatible` أو `voyage`؛ ويمكن أيضًا أن يكون `models.providers.<id>` مهيأً تشير قيمة `api` فيه إلى محوّل تضمين للذاكرة أو API لنموذج متوافق مع OpenAI |
| `model`    | `string`  | القيمة الافتراضية للمزوّد | اسم نموذج التضمين                                                                                                                                                                                                                                                                        |
| `fallback` | `string`  | `"none"`         | معرّف المحوّل الاحتياطي عند فشل المحوّل الأساسي                                                                                                                                                                                                                                                  |

عندما لا يكون `provider` معيّنًا، يستخدم OpenClaw تضمينات OpenAI. عيّن `provider`
صراحةً لاستخدام Bedrock أو DeepInfra أو Gemini أو GitHub Copilot أو Mistral أو Ollama أو
Voyage أو نموذج GGUF محلي أو نقطة نهاية `/v1/embeddings` متوافقة مع OpenAI.
تُحل الإعدادات القديمة التي ما زالت تتضمن `provider: "auto"` إلى `openai`.

<Warning>
قد يؤدي تغيير مزوّد التضمين أو النموذج أو إعدادات المزوّد أو المصادر أو النطاق أو
التقسيم إلى مقاطع أو أداة التقسيم إلى رموز إلى جعل فهرس متجهات SQLite الحالي غير متوافق.
يوقف OpenClaw البحث المتجهي مؤقتًا ويبلغ عن تحذير بشأن هوية الفهرس بدلًا من
إعادة تضمين كل شيء تلقائيًا. أعِد البناء عندما تكون مستعدًا باستخدام
`openclaw memory status --index --agent <id>` أو
`openclaw memory index --force --agent <id>`.
</Warning>

عندما لا يكون `provider` معيّنًا، أو يكون `provider: "auto"` القديم موجودًا، أو
يحدد `provider: "none"` عمدًا وضع FTS فقط، يمكن لاسترجاع الذاكرة أن يظل
يستخدم ترتيب FTS المعجمي عندما لا تكون التضمينات متاحة.

تفشل المزوّدات غير المحلية المحددة صراحةً بشكل مغلق. إذا عيّنت `memorySearch.provider` إلى
مزوّد فعلي مدعوم عن بُعد، مثل Bedrock أو DeepInfra أو Gemini أو GitHub
Copilot أو LM Studio أو Mistral أو Ollama أو OpenAI أو Voyage أو مزوّد مخصص
متوافق مع OpenAI، ولم يكن ذلك المزوّد متاحًا في وقت التشغيل، فإن `memory_search`
يعيد نتيجة عدم توفر بدلًا من استخدام استرجاع FTS فقط بصمت. أصلح
إعدادات المزوّد/المصادقة، أو انتقل إلى مزوّد يمكن الوصول إليه، أو عيّن
`provider: "none"` إذا كنت تريد استرجاعًا مقصودًا باستخدام FTS فقط.

### معرّفات المزوّدات المخصصة

يمكن أن يشير `memorySearch.provider` إلى إدخال `models.providers.<id>` مخصص لمحوّلات المزوّد الخاصة بالذاكرة، مثل `ollama`، أو لـ APIs نماذج متوافقة مع OpenAI، مثل `openai-responses` / `openai-completions`. يحل OpenClaw مالك `api` لذلك المزوّد من أجل محوّل التضمين، مع الحفاظ على معرّف المزوّد المخصص لمعالجة نقطة النهاية والمصادقة وبادئة النموذج. يتيح ذلك للإعدادات متعددة وحدات GPU أو متعددة المضيفين تخصيص تضمينات الذاكرة لنقطة نهاية محلية محددة:

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

### حل مفتاح API

تتطلب التضمينات البعيدة مفتاح API. ويستخدم Bedrock بدلًا من ذلك سلسلة بيانات الاعتماد الافتراضية لـ AWS SDK (أدوار المثيلات أو SSO أو مفاتيح الوصول أو مفتاح API لـ Bedrock).

| المزوّد       | متغير البيئة                                             | مفتاح الإعداد                          |
| -------------- | --------------------------------------------------- | ----------------------------------- |
| Bedrock        | سلسلة بيانات اعتماد AWS، أو `AWS_BEARER_TOKEN_BEDROCK` | لا حاجة إلى مفتاح API                   |
| DeepInfra      | `DEEPINFRA_API_KEY`                                 | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                    | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`، `GH_TOKEN`، `GITHUB_TOKEN`  | ملف تعريف المصادقة عبر تسجيل الدخول من الجهاز       |
| Mistral        | `MISTRAL_API_KEY`                                   | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (عنصر نائب)                      | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                    | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                    | `models.providers.voyage.apiKey`    |

<Note>
لا يغطي OAuth الخاص بـ Codex سوى المحادثة/الإكمالات، ولا يفي بطلبات التضمين.
</Note>

---

## إعداد نقطة النهاية البعيدة

استخدم `provider: "openai-compatible"` لخادم `/v1/embeddings` عام متوافق مع OpenAI
يجب ألا يرث بيانات اعتماد محادثة OpenAI العامة.

<ParamField path="remote.baseUrl" type="string">
  عنوان URL أساسي مخصص لـ API.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  تجاوز مفتاح API.
</ParamField>
<ParamField path="remote.headers" type="object">
  ترويسات HTTP إضافية (تُدمج مع القيم الافتراضية للمزوّد).
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

## الإعدادات الخاصة بكل مزوّد

<AccordionGroup>
  <Accordion title="Gemini">
    | المفتاح                    | النوع     | القيمة الافتراضية                | الوصف                                |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------- |
    | `model`                | `string` | `gemini-embedding-001` | يدعم أيضًا `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                 | لـ Embedding 2: ‏768 أو 1536 أو 3072        |

    <Warning>
    يؤدي تغيير النموذج أو `outputDimensionality` إلى تغيير هوية الفهرس. يوقف OpenClaw
    البحث المتجهي مؤقتًا إلى أن تعيد بناء فهرس الذاكرة صراحةً.
    </Warning>

  </Accordion>
  <Accordion title="أنواع الإدخال المتوافقة مع OpenAI">
    يمكن لنقاط نهاية التضمين المتوافقة مع OpenAI الاشتراك في حقول طلب `input_type` الخاصة بالمزوّد. يفيد ذلك لنماذج التضمين غير المتماثلة التي تتطلب تسميات مختلفة لتضمينات الاستعلام والمستندات.

    | المفتاح                 | النوع     | القيمة الافتراضية | الوصف                                             |
    | ------------------- | -------- | ------- | -------------------------------------------------------- |
    | `inputType`         | `string` | غير معيّن   | `input_type` مشترك لتضمينات الاستعلام والمستندات   |
    | `queryInputType`    | `string` | غير معيّن   | `input_type` في وقت الاستعلام؛ يتجاوز `inputType`          |
    | `documentInputType` | `string` | غير معيّن   | `input_type` للفهرس/المستند؛ يتجاوز `inputType`      |

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

    يؤثر تغيير هذه القيم في هوية ذاكرة التخزين المؤقت للتضمينات لفهرسة الدفعات لدى المزوّد، ويجب أن تتبعه إعادة فهرسة للذاكرة عندما يتعامل النموذج في المنبع مع التسميات بصورة مختلفة.

  </Accordion>
  <Accordion title="Bedrock">
    ### إعداد تضمين Bedrock

    يستخدم Bedrock سلسلة بيانات الاعتماد الافتراضية لـ AWS SDK، بالإضافة إلى رمز حامل يتحقق منه OpenClaw، ولذلك لا تُخزّن مفاتيح API في الإعدادات. إذا كان OpenClaw يعمل على EC2 بدور مثيل مفعّل لـ Bedrock، فما عليك سوى تعيين المزوّد والنموذج:

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

    | المفتاح                    | النوع     | القيمة الافتراضية                        | الوصف                     |
    | ---------------------- | -------- | ------------------------------- | -------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | أي معرّف نموذج تضمين من Bedrock  |
    | `outputDimensionality` | `number` | القيمة الافتراضية للنموذج                  | لـ Titan V2: ‏256 أو 512 أو 1024 |

    **النماذج المدعومة** (مع اكتشاف العائلة والقيم الافتراضية للأبعاد):

    | معرّف النموذج                              | المزوّد    | الأبعاد الافتراضية | الأبعاد القابلة للتهيئة       |
    | ------------------------------------------- | ---------- | ------------- | -------------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024         | 256, 512, 1024             |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536         | --                          |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536         | --                          |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024         | --                          |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024         | 256, 384, 1024, 3072       |
    | `cohere.embed-english-v3`                  | Cohere     | 1024         | --                          |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024         | --                          |
    | `cohere.embed-v4:0`                        | Cohere     | 1536         | 256, 384, 512, 768, 1024, 1536 |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512          | --                          |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024         | --                          |

    ترث المتغيرات ذات لاحقة معدل النقل (مثل `amazon.titan-embed-text-v1:2:8k`) ومعرّفات ملفات تعريف الاستدلال ذات بادئة المنطقة (مثل `us.amazon.titan-embed-text-v2:0`) تهيئة النموذج الأساسي.

    **المنطقة:** تُحدَّد بهذا الترتيب: تجاوز `memorySearch.remote.baseUrl`، ثم تهيئة `models.providers.amazon-bedrock.baseUrl`، ثم `AWS_REGION`، ثم `AWS_DEFAULT_REGION`، وأخيرًا القيمة الافتراضية `us-east-1`.

    **المصادقة:** يتحقق OpenClaw أولًا من `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` أو `AWS_BEARER_TOKEN_BEDROCK`، ثم ينتقل إلى سلسلة موفّري بيانات الاعتماد الافتراضية القياسية في AWS SDK:

    1. متغيرات البيئة (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)، ما لم يكن `AWS_PROFILE` معيّنًا أيضًا
    2. SSO (فقط عند تهيئة حقول SSO)
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

    لتحقيق مبدأ أقل الصلاحيات، احصر `InvokeModel` في النموذج المحدد:

    ```text
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="محلي (GGUF + llama.cpp)">
    | المفتاح               | النوع              | الافتراضي              | الوصف                                                                                                                                                                                                                                                                                                                  |
    | --------------------- | ------------------ | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | يُنزَّل تلقائيًا       | المسار إلى ملف نموذج GGUF                                                                                                                                                                                                                                                                                              |
    | `local.modelCacheDir` | `string`           | افتراضي node-llama-cpp | دليل التخزين المؤقت للنماذج المنزّلة                                                                                                                                                                                                                                                                                  |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | حجم نافذة السياق لسياق التضمين. تغطي 4096 الأجزاء المعتادة (128-512 رمزًا) مع تقييد VRAM غير المخصّصة للأوزان. اخفضها إلى 1024-2048 على المضيفات محدودة الموارد. يستخدم `"auto"` الحد الأقصى الذي دُرِّب عليه النموذج -- ولا يُنصح به للنماذج ذات 8B+ (Qwen3-Embedding-8B: قد يؤدي ما يصل إلى 40 960 رمزًا إلى رفع VRAM إلى ~32 GB). |

    ثبّت موفّر llama.cpp الرسمي أولًا: `openclaw plugins install @openclaw/llama-cpp-provider`.
    النموذج الافتراضي: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB، يُنزَّل تلقائيًا). لا تزال نسخ المصدر تتطلب الموافقة على البناء الأصلي: `pnpm approve-builds` ثم `pnpm rebuild node-llama-cpp`.

    استخدم CLI المستقل للتحقق من مسار الموفّر نفسه الذي يستخدمه Gateway:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    تُفيد قيم `local.contextSize` الرقمية أيضًا في تحديد node-llama-cpp التلقائي لطبقات GPU كي تتلاءم أوزان النموذج وسياق التضمين المطلوب معًا. يُبلغ `openclaw memory status --deep` عن آخر واجهة خلفية معروفة لـ llama.cpp والجهاز والتفريغ والسياق المطلوب وحقائق الذاكرة ذات الطابع الزمني بعد تحميل بيئة التشغيل؛ ولا تؤدي الحالة الخاملة إلى تحميل نموذج.

    عيّن `provider: "local"` صراحةً للتضمينات المحلية بصيغة GGUF. تُدعَم `hf:` ومراجع نماذج HTTP(S) في التهيئات المحلية الصريحة (عبر آلية حل النماذج في node-llama-cpp)، لكنها لا تغيّر الموفّر الافتراضي.

  </Accordion>
</AccordionGroup>

### مهلة التضمين المضمّن

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  تجاوز مهلة دفعات التضمين المضمّنة أثناء فهرسة الذاكرة.

عند عدم التعيين، يُستخدم الإعداد الافتراضي للموفّر: 600 ثانية للموفّرين المحليين/المستضافين ذاتيًا مثل `local` و`ollama` و`lmstudio`، و120 ثانية للموفّرين المستضافين. زد هذه القيمة عندما تكون دفعات التضمين المحلية المعتمدة على CPU سليمة لكنها بطيئة.
</ParamField>

---

## سلوك الفهرسة

تقع جميعها ضمن `memorySearch.sync` ما لم يُذكر خلاف ذلك:

| المفتاح                        | النوع     | الافتراضي | الوصف                                                                  |
| ------------------------------ | --------- | ------- | --------------------------------------------------------------------- |
| `onSessionStart`               | `boolean` | `true`  | مزامنة فهرس الذاكرة عند بدء جلسة                                      |
| `onSearch`                     | `boolean` | `true`  | المزامنة الكسولة عند البحث بعد اكتشاف تغييرات في المحتوى              |
| `watch`                        | `boolean` | `true`  | مراقبة ملفات الذاكرة (chokidar) وجدولة إعادة الفهرسة عند حدوث تغييرات |
| `watchDebounceMs`              | `number`  | `1500`  | نافذة إزالة الارتداد لدمج أحداث مراقبة الملفات المتسارعة             |
| `intervalMinutes`              | `number`  | `0`     | الفاصل الدوري لإعادة الفهرسة بالدقائق (يعطّل `0` ذلك)                   |
| `sessions.postCompactionForce` | `boolean` | `true`  | فرض إعادة فهرسة الجلسة بعد تحديثات النص المنسوخ الناتجة عن Compaction |

<ParamField path="chunking.tokens" type="number">
  حجم الجزء بالرموز المستخدم عند تقسيم مصادر الذاكرة قبل التضمين (الافتراضي: 400).
</ParamField>
<ParamField path="chunking.overlap" type="number">
  تداخل الرموز بين الأجزاء المتجاورة للحفاظ على السياق قرب حدود التقسيم (الافتراضي: 80).
</ParamField>

<Note>
يؤدي تغيير `chunking.tokens` أو `chunking.overlap` إلى تغيير حدود الأجزاء وإبطال هوية الفهرس الحالية (راجع التحذير ضمن اختيار الموفّر).
</Note>

---

## تهيئة البحث الهجين

تقع جميعها ضمن `memorySearch.query`:

| المفتاح      | النوع    | الافتراضي | الوصف                                           |
| ------------ | -------- | ------- | ----------------------------------------- |
| `maxResults` | `number` | `6`     | الحد الأقصى لنتائج الذاكرة المعادة قبل الحقن   |
| `minScore`   | `number` | `0.35`  | الحد الأدنى لدرجة الصلة لتضمين نتيجة           |

وتقع هذه ضمن `memorySearch.query.hybrid`:

| المفتاح               | النوع     | الافتراضي | الوصف                               |
| --------------------- | --------- | ------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`  | تمكين البحث الهجين BM25 + المتجهي |
| `vectorWeight`        | `number`  | `0.7`   | وزن الدرجات المتجهية (0-1)        |
| `textWeight`          | `number`  | `0.3`   | وزن درجات BM25 ‏(0-1)              |
| `candidateMultiplier` | `number`  | `4`     | مُضاعِف حجم مجموعة المرشحين        |

<Tabs>
  <Tab title="MMR (التنوع)">
    | المفتاح       | النوع     | الافتراضي | الوصف                                  |
    | ------------- | --------- | ------- | ------------------------------------- |
    | `mmr.enabled` | `boolean` | `false` | تمكين إعادة الترتيب باستخدام MMR      |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = أقصى تنوع، 1 = أقصى صلة           |
  </Tab>
  <Tab title="الاضمحلال الزمني (الحداثة)">
    | المفتاح                     | النوع     | الافتراضي | الوصف                         |
    | ---------------------------- | --------- | ------- | -------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | تمكين تعزيز الحداثة          |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | تنخفض الدرجة إلى النصف كل N يومًا |

    لا تتعرض الملفات دائمة الصلاحية (`MEMORY.md`، والملفات غير المؤرخة في `memory/`) للاضمحلال مطلقًا.

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

| المفتاح      | النوع      | الوصف                                      |
| ------------ | ---------- | ---------------------------------------- |
| `extraPaths` | `string[]` | أدلة أو ملفات إضافية لفهرستها            |

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

يمكن أن تكون المسارات مطلقة أو نسبية إلى مساحة العمل. تُفحص الأدلة تكراريًا بحثًا عن ملفات `.md`. تعتمد معالجة الروابط الرمزية على الواجهة الخلفية النشطة: يتخطى المحرك المضمّن الروابط الرمزية، بينما يتبع QMD سلوك ماسح QMD الأساسي.

للبحث في النصوص المنسوخة عبر الوكلاء ضمن نطاق وكيل، استخدم `agents.list[].memorySearch.qmd.extraCollections` بدلًا من `memory.qmd.paths`. تتبع تلك المجموعات الإضافية بنية `{ path, name, pattern? }` نفسها، لكنها تُدمج لكل وكيل ويمكنها الاحتفاظ بأسماء مشتركة صريحة عندما يشير المسار إلى خارج مساحة العمل الحالية. إذا ظهر المسار المحلول نفسه في كل من `memory.qmd.paths` و`memorySearch.qmd.extraCollections`، يحتفظ QMD بالإدخال الأول ويتخطى التكرار.

---

## الذاكرة متعددة الوسائط (Gemini)

فهرس الصور والصوت إلى جانب Markdown باستخدام Gemini Embedding 2:

| المفتاح                       | النوع       | الافتراضي    | الوصف                            |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | تفعيل الفهرسة متعددة الوسائط             |
| `multimodal.modalities`   | `string[]` | --         | `["image"]` أو `["audio"]` أو `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10485760` | الحد الأقصى لحجم ملف الفهرسة (10 MiB)    |

<Note>
ينطبق فقط على الملفات في `extraPaths`. تظل جذور الذاكرة الافتراضية مقتصرة على Markdown. يتطلب `gemini-embedding-2-preview`. يجب أن تكون قيمة `fallback` هي `"none"`.
</Note>

التنسيقات المدعومة: `.jpg` و`.jpeg` و`.png` و`.webp` و`.gif` و`.heic` و`.heif` (الصور)؛ و`.mp3` و`.wav` و`.ogg` و`.opus` و`.m4a` و`.aac` و`.flac` (الصوت).

---

## ذاكرة التخزين المؤقت للتضمينات

| المفتاح                | النوع      | الافتراضي | الوصف                                  |
| ------------------ | --------- | ------- | -------------------------------------------- |
| `cache.enabled`    | `boolean` | `true`  | تخزين تضمينات المقاطع مؤقتًا في SQLite             |
| `cache.maxEntries` | `number`  | غير معيّن   | حد أقصى تقريبي للتضمينات المخزنة مؤقتًا |

يمنع إعادة تضمين النص غير المتغير أثناء إعادة الفهرسة أو تحديثات النصوص المنسوخة. اترك `maxEntries` دون تعيين للحصول على ذاكرة تخزين مؤقت غير محدودة؛ وعيّنه عندما يكون نمو مساحة القرص أهم من أقصى سرعة لإعادة الفهرسة. عند تعيينه، تُحذف أقدم الإدخالات أولًا (وفق وقت آخر تحديث) بمجرد تجاوز ذاكرة التخزين المؤقت للحد.

---

## الفهرسة الدفعية

| المفتاح                           | النوع      | الافتراضي | الوصف                |
| ----------------------------- | --------- | ------- | -------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`     | تضمينات مضمنة متوازية |
| `remote.batch.enabled`        | `boolean` | `false` | تفعيل واجهة API للتضمين الدفعي |
| `remote.batch.concurrency`    | `number`  | `2`     | مهام دفعية متوازية        |
| `remote.batch.wait`           | `boolean` | `true`  | انتظار اكتمال الدفعة  |
| `remote.batch.pollIntervalMs` | `number`  | `2000`  | فاصل الاستقصاء              |
| `remote.batch.timeoutMinutes` | `number`  | `60`    | مهلة الدفعة              |

متاحة لـ `gemini` و`openai` و`voyage`. تكون الدفعات في OpenAI عادةً الأسرع والأقل تكلفة لعمليات الملء اللاحقة الكبيرة.

يتحكم `remote.nonBatchConcurrency` في استدعاءات التضمين المضمنة التي تستخدمها المزوّدات المحلية/ذاتية الاستضافة والمزوّدات المستضافة عندما لا تكون واجهات API الدفعية للمزوّد نشطة. القيمة الافتراضية في Ollama هي `1` للفهرسة غير الدفعية لتجنب إرهاق المضيفات المحلية الأصغر؛ عيّن قيمة أعلى على الأجهزة الأكبر.

هذا منفصل عن `sync.embeddingBatchTimeoutSeconds`، الذي يتحكم في مهلة استدعاءات التضمين المضمنة.

---

## البحث في ذاكرة الجلسة (تجريبي)

فهرس النصوص المنسوخة للجلسات واعرضها عبر `memory_search`:

| المفتاح                           | النوع       | الافتراضي      | الوصف                             |
| ----------------------------- | ---------- | ------------ | --------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | تفعيل فهرسة الجلسات                 |
| `sources`                     | `string[]` | `["memory"]` | إضافة `"sessions"` لتضمين النصوص المنسوخة |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | حد البايتات لإعادة الفهرسة              |
| `sync.sessions.deltaMessages` | `number`   | `50`         | حد الرسائل لإعادة الفهرسة           |

<Warning>
فهرسة الجلسات اختيارية وتعمل بصورة غير متزامنة. قد تكون النتائج قديمة قليلًا. توجد سجلات الجلسات على القرص، لذا تعامل مع الوصول إلى نظام الملفات بوصفه حد الثقة.
</Warning>

تلتزم نتائج النصوص المنسوخة للجلسات أيضًا بـ
[`tools.sessions.visibility`](/ar/gateway/config-tools#toolssessions). لا يكشف نطاق الرؤية الافتراضي
`tree` إلا الجلسة الحالية والجلسات التي أنشأتها. لاسترجاع
جلسة غير مرتبطة بالوكيل نفسه أرسلها Gateway من جلسة مختلفة،
مثل رسالة مباشرة، وسّع نطاق الرؤية عمدًا إلى `agent` (أو `all` فقط
عندما يكون الاسترجاع عبر الوكلاء مطلوبًا أيضًا وتسمح به سياسة التواصل بين الوكلاء).

تضع الأمثلة أدناه هذه الإعدادات ضمن `agents.defaults`. يمكن أيضًا
تطبيق إعدادات `memorySearch` المكافئة في تجاوز خاص بكل وكيل عندما ينبغي
لوكيل واحد فقط فهرسة النصوص المنسوخة للجلسات والبحث فيها.

للاسترجاع من Gateway إلى الرسائل المباشرة ضمن الوكيل نفسه:

<Tabs>
  <Tab title="الواجهة الخلفية المدمجة">
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
  <Tab title="الواجهة الخلفية لـ QMD">
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

عند استخدام QMD، لا يصدّر `agents.defaults.memorySearch.experimental.sessionMemory` و
`sources: ["sessions"]` النصوص المنسوخة إلى QMD بمفردهما. عيّن
`memory.qmd.sessions.enabled: true` أيضًا.

---

## تسريع المتجهات في SQLite ‏(sqlite-vec)

| المفتاح                          | النوع      | الافتراضي | الوصف                       |
| ---------------------------- | --------- | ------- | --------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | استخدام sqlite-vec لاستعلامات المتجهات |
| `store.vector.extensionPath` | `string`  | مضمّن | تجاوز مسار sqlite-vec          |

عندما لا يتوفر sqlite-vec، يعود OpenClaw تلقائيًا إلى تشابه جيب التمام داخل العملية.

---

## تخزين الفهرس

توجد فهارس الذاكرة المدمجة في قاعدة بيانات OpenClaw SQLite الخاصة بكل وكيل في
`agents/<agentId>/agent/openclaw-agent.sqlite`.

| المفتاح                   | النوع     | الافتراضي     | الوصف                               |
| --------------------- | -------- | ----------- | ----------------------------------------- |
| `store.fts.tokenizer` | `string` | `unicode61` | مُجزّئ FTS5 ‏(`unicode61` أو `trigram`) |

---

## إعداد الواجهة الخلفية لـ QMD

عيّن `memory.backend = "qmd"` للتفعيل. توجد جميع إعدادات QMD ضمن `memory.qmd`:

| المفتاح                      | النوع      | الافتراضي  | الوصف                                                                           |
| ------------------------ | --------- | -------- | ------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`    | مسار ملف QMD التنفيذي؛ عيّن مسارًا مطلقًا عندما تختلف `PATH` الخاصة بالخدمة عن صدفتك |
| `searchMode`             | `string`  | `search` | أمر البحث: `search` و`vsearch` و`query`                                          |
| `rerank`                 | `boolean` | --       | عيّنه إلى `false` مع `searchMode: "query"` وQMD 2.1+ لتخطي إعادة الترتيب في QMD          |
| `includeDefaultMemory`   | `boolean` | `true`   | فهرسة `MEMORY.md` و`memory/**/*.md` تلقائيًا                                             |
| `paths[]`                | `array`   | --       | مسارات إضافية: `{ name, path, pattern? }`                                               |
| `sessions.enabled`       | `boolean` | `false`  | تصدير النصوص المنسوخة للجلسات إلى QMD                                                   |
| `sessions.retentionDays` | `number`  | --       | مدة الاحتفاظ بالنصوص المنسوخة                                                                  |
| `sessions.exportDir`     | `string`  | --       | دليل التصدير                                                                      |

يعتمد `searchMode: "search"` على البحث المعجمي/BM25 فقط. لا يشغّل OpenClaw فحوصات جاهزية المتجهات الدلالية أو صيانة تضمينات QMD لهذا الوضع، بما في ذلك أثناء `memory status --deep`؛ ويظل `vsearch` و`query` يتطلبان جاهزية متجهات QMD وتضميناته.

لا يغيّر `rerank: false` إلا وضع `query` في QMD ويتطلب QMD 2.1 أو أحدث. في وضع CLI المباشر، يمرر OpenClaw ‏`--no-rerank`؛ وفي وضع MCP المدعوم بـ mcporter، يمرر `rerank: false` إلى أداة الاستعلام الموحدة في QMD. اتركه دون تعيين لاستخدام سلوك إعادة ترتيب الاستعلام الافتراضي في QMD.

يفضّل OpenClaw أشكال مجموعات QMD واستعلامات MCP الحالية، لكنه يحافظ على عمل إصدارات QMD الأقدم عبر تجربة علامات أنماط المجموعات المتوافقة وأسماء أدوات MCP الأقدم عند الحاجة. عندما يعلن QMD دعمه لعدة مرشحات للمجموعات، يُبحث في المجموعات ذات المصدر نفسه باستخدام عملية QMD واحدة؛ بينما تحتفظ إصدارات QMD الأقدم بمسار التوافق الخاص بكل مجموعة. ويعني المصدر نفسه أن مجموعات الذاكرة الدائمة (ملفات الذاكرة الافتراضية بالإضافة إلى المسارات المخصصة) تُجمع معًا، بينما تظل مجموعات النصوص المنسوخة للجلسات مجموعة منفصلة بحيث يظل تنويع المصادر متضمنًا لكلا المدخلين.

<Note>
تظل تجاوزات نماذج QMD في جانب QMD، وليس في إعداد OpenClaw. إذا لزم تجاوز نماذج QMD عموميًا، فعيّن متغيرات البيئة مثل `QMD_EMBED_MODEL` و`QMD_RERANK_MODEL` و`QMD_GENERATE_MODEL` في بيئة تشغيل Gateway.
</Note>

### تكامل mcporter

جميعها ضمن `memory.qmd.mcporter`. يوجّه عمليات بحث QMD عبر برنامج MCP الخفي طويل التشغيل `mcporter` بدلًا من إنشاء `qmd` لكل استعلام، مما يقلل عبء بدء التشغيل البارد للنماذج الأكبر.

| المفتاح           | النوع      | الافتراضي | الوصف                                                            |
| ------------- | --------- | ------- | ---------------------------------------------------------------------- |
| `enabled`     | `boolean` | `false` | توجيه استدعاءات QMD عبر mcporter بدلًا من إنشاء `qmd` لكل طلب |
| `serverName`  | `string`  | `qmd`   | اسم خادم mcporter الذي يشغّل `qmd mcp` مع `lifecycle: keep-alive`  |
| `startDaemon` | `boolean` | `true`  | بدء برنامج mcporter الخفي تلقائيًا عندما تكون قيمة `enabled` هي true         |

يتطلب تثبيت `mcporter` ووجوده على PATH، بالإضافة إلى خادم mcporter مُعدّ لتشغيل `qmd mcp`. أبقه معطلًا للإعدادات المحلية الأبسط التي تكون فيها تكلفة إنشاء عملية لكل استعلام مقبولة.

<AccordionGroup>
  <Accordion title="جدول التحديث">
    | المفتاح                       | النوع      | الافتراضي | الوصف                           |
    | --------------------------- | --------- | -------- | ---------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | الفاصل الزمني للتحديث                      |
    | `update.debounceMs`       | `number`  | `15000` | إزالة ارتداد تغييرات الملفات                 |
    | `update.onBoot`           | `boolean` | `true`  | التحديث عند فتح مدير QMD طويل العمر؛ اضبطه على false لتخطي تحديث الإقلاع الفوري |
    | `update.startup`          | `string`  | `off`   | تهيئة QMD اختيارية عند بدء Gateway: `off` أو `idle` أو `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | التأخير قبل تشغيل تحديث `startup: "idle"` |
    | `update.waitForBootSync`  | `boolean` | `false` | حظر فتح المدير حتى اكتمال تحديثه الأولي |
    | `update.embedInterval`    | `string`  | `60m`   | وتيرة تضمين منفصلة                |
    | `update.commandTimeoutMs` | `number`  | `30000` | مهلة أوامر صيانة QMD (سرد المجموعة/إضافتها) |
    | `update.updateTimeoutMs`  | `number`  | `120000` | مهلة كل دورة `qmd update`   |
    | `update.embedTimeoutMs`   | `number`  | `120000` | مهلة كل دورة `qmd embed`    |
  </Accordion>
  <Accordion title="الحدود">
    | المفتاح                       | النوع     | الافتراضي | الوصف                |
    | --------------------------- | -------- | ------- | ------------------------------ |
    | `limits.maxResults`       | `number` | `4`     | الحد الأقصى لنتائج البحث         |
    | `limits.maxSnippetChars`  | `number` | `450`   | تقييد طول المقتطف       |
    | `limits.maxInjectedChars` | `number` | `2200`  | تقييد إجمالي الأحرف المحقونة |
    | `limits.timeoutMs`        | `number` | `4000`  | مهلة أمر QMD أثناء البحث المدعوم بـ QMD، بما في ذلك `memory_search`؛ يحتفظ الإعداد والمزامنة والرجوع الاحتياطي المدمج والعمل التكميلي بالمهلة الافتراضية للأداة |
  </Accordion>
  <Accordion title="النطاق">
    يتحكم في الجلسات التي يمكنها تلقي نتائج بحث QMD. يستخدم المخطط نفسه كما في [`session.sendPolicy`](/ar/gateway/config-agents#session):

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

    يقتصر الإعداد الافتراضي المضمّن على الرسائل الخاصة/المباشرة، ويرفض المجموعات وأنواع القنوات الأخرى. يطابق `match.keyPrefix` مفتاح الجلسة الموحّد؛ ويطابق `match.rawKeyPrefix` المفتاح الخام بما في ذلك `agent:<id>:`.

  </Accordion>
  <Accordion title="الاستشهادات">
    ينطبق `memory.citations` على جميع الخلفيات:

    | القيمة            | السلوك                                            |
    | ------------------ | ------------------------------------------------------ |
    | `auto` (الافتراضي) | تضمين تذييل `Source: <path#line>` في المقتطفات    |
    | `on`             | تضمين التذييل دائمًا                               |
    | `off`            | حذف التذييل (يظل المسار يُمرر داخليًا إلى الوكيل) |

  </Accordion>
</AccordionGroup>

عند تمكين تهيئة QMD عند بدء Gateway، يشغّل OpenClaw ‏QMD فقط للوكلاء المؤهلين. إذا كانت `update.onBoot` تساوي true ولم تُهيأ أي صيانة بفاصل زمني/تضمين، يستخدم بدء التشغيل مديرًا لمرة واحدة لتنفيذ تحديث الإقلاع ثم يغلقه. وإذا هُيئ فاصل زمني للتحديث أو التضمين، يفتح بدء التشغيل مدير QMD طويل العمر ليتولى المراقب ومؤقتات الفواصل الزمنية؛ ولا يتخطى `update.onBoot: false` سوى تحديث الإقلاع الفوري.

### مثال QMD كامل

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

تُهيأ Dreaming ضمن `plugins.entries.memory-core.config.dreaming`، وليس ضمن `agents.defaults.memorySearch`.

تعمل Dreaming كعملية مسح مجدولة واحدة، وتستخدم مراحل خفيفة/عميقة/REM داخلية بوصفها تفصيلًا تنفيذيًا.

للاطلاع على السلوك المفاهيمي وأوامر الشرطة المائلة، راجع [Dreaming](/ar/concepts/dreaming).

### إعدادات المستخدم

| المفتاح                                    | النوع      | الافتراضي       | الوصف                                                                                                                      |
| -------------------------------------- | --------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`       | تمكين Dreaming أو تعطيلها بالكامل                                                                                              |
| `frequency`                            | `string`  | `0 3 * * *`   | وتيرة Cron اختيارية لعملية مسح Dreaming الكاملة                                                                                |
| `model`                                | `string`  | النموذج الافتراضي | تجاوز اختياري لنموذج الوكيل الفرعي Dream Diary                                                                                     |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`         | الحد الأقصى للرموز المقدّرة المحتفظ بها من كل مقتطف استدعاء قصير الأمد يُرقّى إلى `MEMORY.md`؛ تظل بيانات تعريف المصدر مرئية |

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
- تكتب Dreaming حالة الآلة إلى `memory/.dreams/`.
- تكتب Dreaming المخرجات السردية القابلة للقراءة البشرية إلى `DREAMS.md` (أو `dreams.md` الموجود).
- يستخدم `dreaming.model` بوابة الثقة الحالية للوكيل الفرعي في Plugin؛ اضبط `plugins.entries.memory-core.subagent.allowModelOverride: true` قبل تمكينه.
- يعيد Dream Diary المحاولة مرة واحدة باستخدام نموذج الجلسة الافتراضي عندما يكون النموذج المهيأ غير متاح. تُسجّل حالات فشل الثقة أو قائمة السماح ولا يُعاد تنفيذها بصمت.
- تُعد سياسة مراحل الخفيف/العميق/REM وحدودها سلوكًا داخليًا، وليست إعدادات موجهة للمستخدم.

</Note>

## ذو صلة

- [مرجع الإعدادات](/ar/gateway/configuration-reference)
- [نظرة عامة على الذاكرة](/ar/concepts/memory)
- [البحث في الذاكرة](/ar/concepts/memory-search)
