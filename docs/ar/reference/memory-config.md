---
read_when:
    - تريد تكوين مزوّدي بحث الذاكرة أو نماذج التضمين
    - تريد إعداد الواجهة الخلفية لـ QMD
    - تريد ضبط البحث الهجين أو MMR أو الاضمحلال الزمني
    - تريد تمكين فهرسة الذاكرة متعددة الوسائط
sidebarTitle: Memory config
summary: جميع خيارات التهيئة للبحث في الذاكرة، وموفّري التضمينات، وQMD، والبحث الهجين، والفهرسة متعددة الوسائط
title: مرجع إعدادات الذاكرة
x-i18n:
    generated_at: "2026-04-30T08:24:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbb21d407f7ec9ef76e68c268138892b12568137735b723579703e535d34b195
    source_path: reference/memory-config.md
    workflow: 16
---

تسرد هذه الصفحة كل إعداد تكوين لبحث الذاكرة في OpenClaw. للاطلاع على النظرات المفاهيمية العامة، راجع:

<CardGroup cols={2}>
  <Card title="نظرة عامة على الذاكرة" href="/ar/concepts/memory">
    كيف تعمل الذاكرة.
  </Card>
  <Card title="المحرك المدمج" href="/ar/concepts/memory-builtin">
    واجهة SQLite الخلفية الافتراضية.
  </Card>
  <Card title="محرك QMD" href="/ar/concepts/memory-qmd">
    مكوّن جانبي يعطي الأولوية للمحلي.
  </Card>
  <Card title="بحث الذاكرة" href="/ar/concepts/memory-search">
    مسار البحث والضبط.
  </Card>
  <Card title="Active Memory" href="/ar/concepts/active-memory">
    وكيل فرعي للذاكرة للجلسات التفاعلية.
  </Card>
</CardGroup>

توجد كل إعدادات بحث الذاكرة ضمن `agents.defaults.memorySearch` في `openclaw.json` ما لم يُذكر خلاف ذلك.

<Note>
إذا كنت تبحث عن مفتاح تفعيل ميزة **Active Memory** وتكوين الوكيل الفرعي، فهو موجود ضمن `plugins.entries.active-memory` بدلًا من `memorySearch`.

تستخدم Active Memory نموذجًا ذا بوابتين:

1. يجب أن يكون Plugin مفعّلًا وأن يستهدف معرّف الوكيل الحالي
2. يجب أن يكون الطلب جلسة دردشة تفاعلية مستمرة مؤهلة

راجع [Active Memory](/ar/concepts/active-memory) لمعرفة نموذج التفعيل، والتكوين المملوك من Plugin، واستمرارية النسخ النصية، ونمط الطرح الآمن.
</Note>

---

## اختيار المزوّد

| المفتاح    | النوع     | الافتراضي             | الوصف                                                                                                                                                                                                                 |
| ---------- | --------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | يُكتشف تلقائيًا       | معرّف محوّل التضمين مثل `bedrock` أو `deepinfra` أو `gemini` أو `github-copilot` أو `local` أو `mistral` أو `ollama` أو `openai` أو `voyage`؛ ويمكن أن يكون أيضًا `models.providers.<id>` مكوّنًا يشير `api` الخاص به إلى أحد تلك المحوّلات |
| `model`    | `string`  | افتراضي المزوّد       | اسم نموذج التضمين                                                                                                                                                                                                     |
| `fallback` | `string`  | `"none"`              | معرّف المحوّل الاحتياطي عند فشل الأساسي                                                                                                                                                                               |
| `enabled`  | `boolean` | `true`                | تفعيل بحث الذاكرة أو تعطيله                                                                                                                                                                                          |

### ترتيب الاكتشاف التلقائي

عندما لا يكون `provider` مضبوطًا، يختار OpenClaw أول خيار متاح:

<Steps>
  <Step title="local">
    يتم اختياره إذا كان `memorySearch.local.modelPath` مكوّنًا وكان الملف موجودًا.
  </Step>
  <Step title="github-copilot">
    يتم اختياره إذا أمكن حل رمز GitHub Copilot مميز (متغير بيئة أو ملف تعريف مصادقة).
  </Step>
  <Step title="openai">
    يتم اختياره إذا أمكن حل مفتاح OpenAI.
  </Step>
  <Step title="gemini">
    يتم اختياره إذا أمكن حل مفتاح Gemini.
  </Step>
  <Step title="voyage">
    يتم اختياره إذا أمكن حل مفتاح Voyage.
  </Step>
  <Step title="mistral">
    يتم اختياره إذا أمكن حل مفتاح Mistral.
  </Step>
  <Step title="deepinfra">
    يتم اختياره إذا أمكن حل مفتاح DeepInfra.
  </Step>
  <Step title="bedrock">
    يتم اختياره إذا نجحت سلسلة بيانات اعتماد AWS SDK في الحل (دور نسخة، أو مفاتيح وصول، أو ملف تعريف، أو SSO، أو هوية ويب، أو تكوين مشترك).
  </Step>
</Steps>

`ollama` مدعوم لكنه لا يُكتشف تلقائيًا (اضبطه صراحةً).

### معرّفات المزوّدين المخصصة

يمكن أن يشير `memorySearch.provider` إلى إدخال `models.providers.<id>` مخصص. يحل OpenClaw مالك `api` لذلك المزوّد لمحوّل التضمين مع الحفاظ على معرّف المزوّد المخصص لمعالجة نقطة النهاية والمصادقة وبادئة النموذج. يتيح هذا للإعدادات متعددة وحدات GPU أو متعددة المضيفين تخصيص تضمينات الذاكرة لنقطة نهاية محلية محددة:

```json5
{
  models: {
    providers: {
      "ollama-5080": {
        api: "ollama",
        baseUrl: "http://gpu-box.local:11435",
        apiKey: "ollama-local",
        models: [{ id: "qwen3-embedding:0.6b" }],
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

تتطلب التضمينات البعيدة مفتاح API. يستخدم Bedrock بدلًا من ذلك سلسلة بيانات اعتماد AWS SDK الافتراضية (أدوار النسخ، SSO، مفاتيح الوصول).

| المزوّد        | متغير البيئة                                      | مفتاح التكوين                       |
| -------------- | -------------------------------------------------- | ----------------------------------- |
| Bedrock        | سلسلة بيانات اعتماد AWS                           | لا حاجة إلى مفتاح API               |
| DeepInfra      | `DEEPINFRA_API_KEY`                                | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | ملف تعريف مصادقة عبر تسجيل دخول الجهاز |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (عنصر نائب)                      | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`    |

<Note>
يغطي Codex OAuth الدردشة/الإكمالات فقط ولا يفي بطلبات التضمين.
</Note>

---

## تكوين نقطة النهاية البعيدة

لنقاط النهاية المخصصة المتوافقة مع OpenAI أو لتجاوز افتراضيات المزوّد:

<ParamField path="remote.baseUrl" type="string">
  عنوان URL الأساسي المخصص لـ API.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  تجاوز مفتاح API.
</ParamField>
<ParamField path="remote.headers" type="object">
  ترويسات HTTP إضافية (مدمجة مع افتراضيات المزوّد).
</ParamField>

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
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

## التكوين الخاص بالمزوّد

<AccordionGroup>
  <Accordion title="Gemini">
    | المفتاح               | النوع    | الافتراضي             | الوصف                                      |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | يدعم أيضًا `gemini-embedding-2-preview`    |
    | `outputDimensionality` | `number` | `3072`                 | لـ Embedding 2: 768 أو 1536 أو 3072        |

    <Warning>
    يؤدي تغيير النموذج أو `outputDimensionality` إلى تشغيل إعادة فهرسة كاملة تلقائية.
    </Warning>

  </Accordion>
  <Accordion title="أنواع الإدخال المتوافقة مع OpenAI">
    يمكن لنقاط نهاية التضمين المتوافقة مع OpenAI الاشتراك في حقول طلب `input_type` الخاصة بالمزوّد. يكون هذا مفيدًا لنماذج التضمين غير المتماثلة التي تتطلب تسميات مختلفة لتضمينات الاستعلام والمستند.

    | المفتاح              | النوع    | الافتراضي   | الوصف                                                   |
    | ------------------- | -------- | ----------- | ------------------------------------------------------- |
    | `inputType`         | `string` | غير مضبوط   | `input_type` مشترك لتضمينات الاستعلام والمستند          |
    | `queryInputType`    | `string` | غير مضبوط   | `input_type` وقت الاستعلام؛ يتجاوز `inputType`          |
    | `documentInputType` | `string` | غير مضبوط   | `input_type` للفهرس/المستند؛ يتجاوز `inputType`         |

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "openai",
            remote: {
              baseUrl: "https://embeddings.example/v1",
              apiKey: "env:EMBEDDINGS_API_KEY",
            },
            model: "asymmetric-embedder",
            queryInputType: "query",
            documentInputType: "passage",
          },
        },
      },
    }
    ```

    يؤثر تغيير هذه القيم في هوية ذاكرة التخزين المؤقت للتضمين لفهرسة دفعات المزوّد، ويجب أن تتبعه إعادة فهرسة للذاكرة عندما يعامل النموذج الأعلى هذه التسميات بشكل مختلف.

  </Accordion>
  <Accordion title="Bedrock">
    يستخدم Bedrock سلسلة بيانات اعتماد AWS SDK الافتراضية، ولا حاجة إلى مفاتيح API. إذا كان OpenClaw يعمل على EC2 بدور نسخة مفعّل لـ Bedrock، فما عليك سوى ضبط المزوّد والنموذج:

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

    | المفتاح               | النوع    | الافتراضي                    | الوصف                            |
    | ---------------------- | -------- | ------------------------------ | -------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | أي معرّف نموذج تضمين Bedrock     |
    | `outputDimensionality` | `number` | افتراضي النموذج                | لـ Titan V2: 256 أو 512 أو 1024  |

    **النماذج المدعومة** (مع اكتشاف العائلة وافتراضيات الأبعاد):

    | معرّف النموذج                              | المزوّد    | الأبعاد الافتراضية | الأبعاد القابلة للتكوين |
    | ------------------------------------------ | ---------- | ------------------ | ------------------------ |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024               | 256، 512، 1024           |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536               | --                       |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536               | --                       |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024               | --                       |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024               | 256، 384، 1024، 3072     |
    | `cohere.embed-english-v3`                  | Cohere     | 1024               | --                       |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024               | --                       |
    | `cohere.embed-v4:0`                        | Cohere     | 1536               | 256-1536                 |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512                | --                       |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024               | --                       |

    ترث المتغيرات ذات لاحقة معدل الإنتاجية (مثل `amazon.titan-embed-text-v1:2:8k`) تكوين النموذج الأساسي.

    **المصادقة:** تستخدم مصادقة Bedrock ترتيب حل بيانات اعتماد AWS SDK القياسي:

    1. متغيرات البيئة (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. ذاكرة التخزين المؤقت لرمز SSO المميز
    3. بيانات اعتماد رمز هوية الويب
    4. بيانات الاعتماد وملفات التكوين المشتركة
    5. بيانات اعتماد بيانات تعريف ECS أو EC2

    تُحل المنطقة من `AWS_REGION` أو `AWS_DEFAULT_REGION` أو `baseUrl` لمزوّد `amazon-bedrock`، أو تكون افتراضيًا `us-east-1`.

    **أذونات IAM:** يحتاج دور IAM أو المستخدم إلى:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    لتطبيق أقل الامتيازات، احصر `InvokeModel` في النموذج المحدد:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Local (GGUF + node-llama-cpp)">
    | المفتاح              | النوع              | الافتراضي             | الوصف                                                                                                                                                                                                                                                                                                                 |
    | --------------------- | ------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | يُنزَّل تلقائيًا        | مسار ملف نموذج GGUF                                                                                                                                                                                                                                                                                                  |
    | `local.modelCacheDir` | `string`           | افتراضي node-llama-cpp | دليل التخزين المؤقت للنماذج المنزَّلة                                                                                                                                                                                                                                                                                 |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | حجم نافذة السياق لسياق التضمين. يغطي 4096 المقاطع المعتادة (128–512 رمزًا) مع ضبط ذاكرة VRAM غير الخاصة بالأوزان. خفّضه إلى 1024–2048 على المضيفات محدودة الموارد. يستخدم `"auto"` الحد الأقصى الذي تدرب عليه النموذج — لا يُنصح به لنماذج 8B+ (Qwen3-Embedding-8B: 40 960 رمزًا → نحو 32 غيغابايت VRAM مقابل نحو 8.8 غيغابايت عند 4096). |

    النموذج الافتراضي: `embeddinggemma-300m-qat-Q8_0.gguf` (نحو 0.6 غيغابايت، يُنزَّل تلقائيًا). يتطلب بناءً أصليًا: `pnpm approve-builds` ثم `pnpm rebuild node-llama-cpp`.

    استخدم CLI المستقلة للتحقق من مسار المزوّد نفسه الذي يستخدمه Gateway:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    إذا كان `provider` هو `auto`، فلن يُحدَّد `local` إلا عندما يشير `local.modelPath` إلى ملف محلي موجود. ما زال يمكن استخدام مراجع النماذج `hf:` وHTTP(S) صراحةً مع `provider: "local"`، لكنها لا تجعل `auto` يحدد المحلي قبل أن يصبح النموذج متاحًا على القرص.

  </Accordion>
</AccordionGroup>

### مهلة التضمين المضمّن

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  تجاوز المهلة الزمنية لدُفعات التضمين المضمّنة أثناء فهرسة الذاكرة.

عند عدم الضبط، يُستخدم الافتراضي الخاص بالمزوّد: 600 ثانية للمزوّدين المحليين/المستضافين ذاتيًا مثل `local` و`ollama` و`lmstudio`، و120 ثانية للمزوّدين المستضافين. زِد هذه القيمة عندما تكون دُفعات التضمين المحلية المعتمدة على CPU سليمة لكنها بطيئة.
</ParamField>

---

## إعدادات البحث الهجين

كلها ضمن `memorySearch.query.hybrid`:

| المفتاح              | النوع     | الافتراضي | الوصف                                  |
| -------------------- | --------- | --------- | -------------------------------------- |
| `enabled`            | `boolean` | `true`    | تفعيل البحث الهجين BM25 + المتجهي       |
| `vectorWeight`       | `number`  | `0.7`     | وزن درجات المتجهات (0-1)               |
| `textWeight`         | `number`  | `0.3`     | وزن درجات BM25 (0-1)                  |
| `candidateMultiplier` | `number` | `4`       | مضاعِف حجم مجموعة المرشحين             |

<Tabs>
  <Tab title="MMR (diversity)">
    | المفتاح      | النوع     | الافتراضي | الوصف                                      |
    | ------------ | --------- | --------- | ------------------------------------------ |
    | `mmr.enabled` | `boolean` | `false`  | تفعيل إعادة الترتيب باستخدام MMR           |
    | `mmr.lambda` | `number`  | `0.7`     | 0 = أقصى تنوع، 1 = أقصى صلة               |
  </Tab>
  <Tab title="Temporal decay (recency)">
    | المفتاح                     | النوع     | الافتراضي | الوصف                         |
    | --------------------------- | --------- | --------- | ----------------------------- |
    | `temporalDecay.enabled`     | `boolean` | `false`   | تفعيل تعزيز الحداثة            |
    | `temporalDecay.halfLifeDays` | `number` | `30`      | تنخفض الدرجة إلى النصف كل N يومًا |

    لا تخضع الملفات دائمة الصلاحية (`MEMORY.md`، والملفات غير المؤرخة في `memory/`) للتناقص أبدًا.

  </Tab>
</Tabs>

### مثال كامل

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
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

| المفتاح     | النوع      | الوصف                                  |
| ----------- | ---------- | -------------------------------------- |
| `extraPaths` | `string[]` | أدلة أو ملفات إضافية للفهرسة           |

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

يمكن أن تكون المسارات مطلقة أو نسبية إلى مساحة العمل. تُفحص الأدلة تكراريًا بحثًا عن ملفات `.md`. يعتمد التعامل مع الروابط الرمزية على الخلفية النشطة: يتجاهل المحرك المدمج الروابط الرمزية، بينما يتبع QMD سلوك ماسح QMD الأساسي.

للبحث في نصوص وكلاء آخرين ضمن نطاق الوكيل، استخدم `agents.list[].memorySearch.qmd.extraCollections` بدلًا من `memory.qmd.paths`. تتبع تلك المجموعات الإضافية الشكل نفسه `{ path, name, pattern? }`، لكنها تُدمج لكل وكيل ويمكنها الحفاظ على الأسماء المشتركة الصريحة عندما يشير المسار إلى خارج مساحة العمل الحالية. إذا ظهر المسار المحلول نفسه في كل من `memory.qmd.paths` و`memorySearch.qmd.extraCollections`، يحتفظ QMD بالإدخال الأول ويتخطى التكرار.

---

## الذاكرة متعددة الوسائط (Gemini)

افهرس الصور والصوت إلى جانب Markdown باستخدام Gemini Embedding 2:

| المفتاح                  | النوع      | الافتراضي | الوصف                                  |
| ------------------------ | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`     | `boolean`  | `false`    | تفعيل الفهرسة متعددة الوسائط           |
| `multimodal.modalities`  | `string[]` | --         | `["image"]` أو `["audio"]` أو `["all"]` |
| `multimodal.maxFileBytes` | `number`  | `10000000` | الحد الأقصى لحجم الملف للفهرسة         |

<Note>
ينطبق فقط على الملفات في `extraPaths`. تبقى جذور الذاكرة الافتراضية مقتصرة على Markdown فقط. يتطلب `gemini-embedding-2-preview`. يجب أن تكون `fallback` هي `"none"`.
</Note>

الصيغ المدعومة: `.jpg`، `.jpeg`، `.png`، `.webp`، `.gif`، `.heic`، `.heif` (الصور)؛ `.mp3`، `.wav`، `.ogg`، `.opus`، `.m4a`، `.aac`، `.flac` (الصوت).

---

## ذاكرة التخزين المؤقت للتضمين

| المفتاح                | النوع      | الافتراضي | الوصف                      |
| ------------------ | --------- | ------- | -------------------------------- |
| `cache.enabled`    | `boolean` | `false` | تخزين تضمينات المقاطع مؤقتًا في SQLite |
| `cache.maxEntries` | `number`  | `50000` | الحد الأقصى للتضمينات المخزنة مؤقتًا            |

يمنع إعادة تضمين النص غير المتغير أثناء إعادة الفهرسة أو تحديثات النصوص المنسوخة.

---

## الفهرسة الدفعية

| المفتاح                           | النوع      | الافتراضي | الوصف                |
| ----------------------------- | --------- | ------- | -------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`     | التضمينات المضمنة المتوازية |
| `remote.batch.enabled`        | `boolean` | `false` | تمكين واجهة API للتضمين الدفعي |
| `remote.batch.concurrency`    | `number`  | `2`     | المهام الدفعية المتوازية        |
| `remote.batch.wait`           | `boolean` | `true`  | انتظار اكتمال الدفعة  |
| `remote.batch.pollIntervalMs` | `number`  | --      | فترة الاستطلاع              |
| `remote.batch.timeoutMinutes` | `number`  | --      | مهلة الدفعة              |

متاح لـ `openai` و`gemini` و`voyage`. عادةً ما يكون OpenAI الدفعي الأسرع والأقل تكلفة لعمليات الردم الكبيرة.

يتحكم `remote.nonBatchConcurrency` في استدعاءات التضمين المضمنة التي تستخدمها المزوّدات المحلية/ذاتية الاستضافة والمزوّدات المستضافة عندما لا تكون واجهات API الدفعية للمزوّد نشطة. يستخدم Ollama القيمة الافتراضية `1` للفهرسة غير الدفعية لتجنب إرهاق المضيفات المحلية الأصغر؛ عيّن قيمة أعلى على الأجهزة الأكبر.

هذا منفصل عن `sync.embeddingBatchTimeoutSeconds`، الذي يتحكم في مهلة استدعاءات التضمين المضمنة.

---

## البحث في ذاكرة الجلسة (تجريبي)

فهرسة النصوص المنسوخة للجلسات وإظهارها عبر `memory_search`:

| المفتاح                           | النوع       | الافتراضي      | الوصف                             |
| ----------------------------- | ---------- | ------------ | --------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | تمكين فهرسة الجلسات                 |
| `sources`                     | `string[]` | `["memory"]` | أضف `"sessions"` لتضمين النصوص المنسوخة |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | حد البايتات لإعادة الفهرسة              |
| `sync.sessions.deltaMessages` | `number`   | `50`         | حد الرسائل لإعادة الفهرسة           |

<Warning>
فهرسة الجلسات اختيارية وتعمل بشكل غير متزامن. قد تكون النتائج قديمة قليلًا. توجد سجلات الجلسات على القرص، لذا تعامل مع الوصول إلى نظام الملفات بصفته حد الثقة.
</Warning>

---

## تسريع متجهات SQLite (sqlite-vec)

| المفتاح                          | النوع      | الافتراضي | الوصف                       |
| ---------------------------- | --------- | ------- | --------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | استخدام sqlite-vec لاستعلامات المتجهات |
| `store.vector.extensionPath` | `string`  | bundled | تجاوز مسار sqlite-vec          |

عند عدم توفر sqlite-vec، يعود OpenClaw تلقائيًا إلى تشابه جيب التمام داخل العملية.

---

## تخزين الفهرس

| المفتاح                   | النوع     | الافتراضي                               | الوصف                                 |
| --------------------- | -------- | ------------------------------------- | ------------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | موقع الفهرس (يدعم الرمز `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                           | مقسّم رموز FTS5 (`unicode61` أو `trigram`)   |

---

## تهيئة خلفية QMD

عيّن `memory.backend = "qmd"` للتمكين. توجد كل إعدادات QMD ضمن `memory.qmd`:

| المفتاح                      | النوع      | الافتراضي  | الوصف                                                                           |
| ------------------------ | --------- | -------- | ------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`    | مسار ملف QMD التنفيذي؛ عيّن مسارًا مطلقًا عندما تختلف خدمة `PATH` عن الصدفة لديك |
| `searchMode`             | `string`  | `search` | أمر البحث: `search`، `vsearch`، `query`                                          |
| `includeDefaultMemory`   | `boolean` | `true`   | فهرسة `MEMORY.md` + `memory/**/*.md` تلقائيًا                                             |
| `paths[]`                | `array`   | --       | مسارات إضافية: `{ name, path, pattern? }`                                               |
| `sessions.enabled`       | `boolean` | `false`  | فهرسة النصوص المنسوخة للجلسات                                                             |
| `sessions.retentionDays` | `number`  | --       | مدة الاحتفاظ بالنصوص المنسوخة                                                                  |
| `sessions.exportDir`     | `string`  | --       | دليل التصدير                                                                      |

`searchMode: "search"` هو معجمي/‏BM25 فقط. لا يشغّل OpenClaw فحوصات جاهزية المتجهات الدلالية أو صيانة تضمينات QMD لهذا النمط، بما في ذلك أثناء `memory status --deep`؛ ويستمر `vsearch` و`query` في طلب جاهزية متجهات QMD والتضمينات.

يفضّل OpenClaw مجموعة QMD الحالية وأشكال استعلام MCP الحالية، لكنه يبقي إصدارات QMD الأقدم عاملة عبر تجربة أعلام أنماط مجموعات متوافقة وأسماء أدوات MCP أقدم عند الحاجة. عندما يعلن QMD دعمه لمرشحات مجموعات متعددة، يتم البحث في مجموعات المصدر نفسه باستخدام عملية QMD واحدة؛ بينما تبقي إصدارات QMD الأقدم مسار التوافق لكل مجموعة. يعني المصدر نفسه أن مجموعات الذاكرة الدائمة تُجمّع معًا، بينما تبقى مجموعات نصوص الجلسات مجموعة منفصلة كي يظل تنويع المصادر مشتملًا على كلا المُدخلين.

<Note>
تبقى تجاوزات نماذج QMD في جانب QMD، وليس في إعداد OpenClaw. إذا احتجت إلى تجاوز نماذج QMD عمومًا، فاضبط متغيرات البيئة مثل `QMD_EMBED_MODEL` و`QMD_RERANK_MODEL` و`QMD_GENERATE_MODEL` في بيئة تشغيل Gateway.
</Note>

<AccordionGroup>
  <Accordion title="جدول التحديث">
    | المفتاح                  | النوع     | الافتراضي | الوصف                                                    |
    | ------------------------- | --------- | ------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | فاصل التحديث                                             |
    | `update.debounceMs`       | `number`  | `15000` | تأجيل تغييرات الملفات                                    |
    | `update.onBoot`           | `boolean` | `true`  | التحديث عند فتح مدير QMD طويل العمر؛ ويتحكم أيضًا في تحديث بدء التشغيل الاختياري |
    | `update.startup`          | `string`  | `off`   | تحديث اختياري عند بدء Gateway: `off` أو `idle` أو `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | التأخير قبل تشغيل تحديث `startup: "idle"`                |
    | `update.waitForBootSync`  | `boolean` | `false` | حظر فتح المدير حتى يكتمل تحديثه الأولي                  |
    | `update.embedInterval`    | `string`  | --      | وتيرة تضمين منفصلة                                      |
    | `update.commandTimeoutMs` | `number`  | --      | المهلة الزمنية لأوامر QMD                               |
    | `update.updateTimeoutMs`  | `number`  | --      | المهلة الزمنية لعمليات تحديث QMD                        |
    | `update.embedTimeoutMs`   | `number`  | --      | المهلة الزمنية لعمليات تضمين QMD                        |
  </Accordion>
  <Accordion title="الحدود">
    | المفتاح                  | النوع    | الافتراضي | الوصف                         |
    | ------------------------- | -------- | ------- | -------------------------- |
    | `limits.maxResults`       | `number` | `6`     | الحد الأقصى لنتائج البحث       |
    | `limits.maxSnippetChars`  | `number` | --      | تقييد طول المقتطف              |
    | `limits.maxInjectedChars` | `number` | --      | تقييد إجمالي الأحرف المُحقنة   |
    | `limits.timeoutMs`        | `number` | `4000`  | مهلة البحث                     |
  </Accordion>
  <Accordion title="النطاق">
    يتحكم في الجلسات التي يمكنها تلقي نتائج بحث QMD. نفس المخطط مثل [`session.sendPolicy`](/ar/gateway/config-agents#session):

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

    يسمح الافتراضي المرفق بالجلسات المباشرة وجلسات القنوات، مع استمرار رفض المجموعات.

    الافتراضي هو الرسائل المباشرة فقط. يطابق `match.keyPrefix` مفتاح الجلسة المُطبّع؛ ويطابق `match.rawKeyPrefix` المفتاح الخام بما في ذلك `agent:<id>:`.

  </Accordion>
  <Accordion title="الاستشهادات">
    ينطبق `memory.citations` على جميع الخلفيات:

    | القيمة           | السلوك                                             |
    | ---------------- | --------------------------------------------------- |
    | `auto` (افتراضي) | تضمين تذييل `Source: <path#line>` في المقتطفات     |
    | `on`             | تضمين التذييل دائمًا                               |
    | `off`            | حذف التذييل (يبقى المسار مُمررًا إلى الوكيل داخليًا) |

  </Accordion>
</AccordionGroup>

تستخدم تحديثات إقلاع QMD مسار عملية فرعية لمرة واحدة أثناء بدء Gateway. يظل مدير QMD طويل العمر مالكًا لمراقب الملفات العادي ومؤقتات الفواصل عندما يُفتح بحث الذاكرة للاستخدام التفاعلي.

### مثال QMD كامل

```json5
{
  memory: {
    backend: "qmd",
    citations: "auto",
    qmd: {
      includeDefaultMemory: true,
      update: { interval: "5m", debounceMs: 15000 },
      limits: { maxResults: 6, timeoutMs: 4000 },
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

يعمل Dreaming كمسح مجدول واحد ويستخدم مراحل داخلية خفيفة/عميقة/REM كتفصيل تنفيذي.

للسلوك المفاهيمي وأوامر الشرطة المائلة، راجع [Dreaming](/ar/concepts/dreaming).

### إعدادات المستخدم

| المفتاح     | النوع     | الافتراضي      | الوصف                                                  |
| ----------- | --------- | ------------- | ------------------------------------------------- |
| `enabled`   | `boolean` | `false`       | تفعيل Dreaming أو تعطيله بالكامل                  |
| `frequency` | `string`  | `0 3 * * *`   | وتيرة Cron اختيارية لمسح Dreaming الكامل          |
| `model`     | `string`  | النموذج الافتراضي | تجاوز اختياري لنموذج الوكيل الفرعي Dream Diary     |

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
- يكتب Dreaming حالة الآلة إلى `memory/.dreams/`.
- يكتب Dreaming المخرجات السردية المقروءة للبشر إلى `DREAMS.md` (أو `dreams.md` الموجود).
- يستخدم `dreaming.model` بوابة الثقة الحالية للوكيل الفرعي في Plugin؛ اضبط `plugins.entries.memory-core.subagent.allowModelOverride: true` قبل تفعيله.
- يعيد Dream Diary المحاولة مرة واحدة باستخدام نموذج الجلسة الافتراضي عندما يكون النموذج المضبوط غير متاح. تُسجل إخفاقات الثقة أو قوائم السماح ولا يُعاد تنفيذها بصمت.
- سياسة مراحل الخفيف/العميق/REM والعتبات سلوك داخلي، وليست إعدادًا موجهًا للمستخدم.

</Note>

## ذات صلة

- [مرجع الإعداد](/ar/gateway/configuration-reference)
- [نظرة عامة على الذاكرة](/ar/concepts/memory)
- [بحث الذاكرة](/ar/concepts/memory-search)
