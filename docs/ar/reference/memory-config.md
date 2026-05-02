---
read_when:
    - تريد تكوين موفّري البحث في الذاكرة أو نماذج التضمين
    - تريد إعداد الواجهة الخلفية لـ QMD
    - تريد ضبط البحث الهجين أو MMR أو التناقص الزمني
    - تريد تمكين فهرسة الذاكرة متعددة الوسائط
sidebarTitle: Memory config
summary: كل خيارات التكوين للبحث في الذاكرة، وموفّري التضمين، وQMD، والبحث الهجين، والفهرسة متعددة الوسائط
title: مرجع تكوين الذاكرة
x-i18n:
    generated_at: "2026-05-02T22:23:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 99624a13b4e700da47a523206569d84c6750266fbb648ec73c463be9c5c285d0
    source_path: reference/memory-config.md
    workflow: 16
---

تسرد هذه الصفحة كل خيار إعدادات لبحث ذاكرة OpenClaw. للاطلاع على الشروحات المفاهيمية، راجع:

<CardGroup cols={2}>
  <Card title="نظرة عامة على الذاكرة" href="/ar/concepts/memory">
    كيف تعمل الذاكرة.
  </Card>
  <Card title="المحرك المدمج" href="/ar/concepts/memory-builtin">
    واجهة SQLite الخلفية الافتراضية.
  </Card>
  <Card title="محرك QMD" href="/ar/concepts/memory-qmd">
    ملحق محلي أولاً.
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
إذا كنت تبحث عن مفتاح تفعيل ميزة **Active Memory** وإعدادات الوكيل الفرعي، فهي موجودة ضمن `plugins.entries.active-memory` بدلاً من `memorySearch`.

تستخدم Active Memory نموذج بوابتين:

1. يجب أن يكون Plugin مفعلاً وأن يستهدف معرّف الوكيل الحالي
2. يجب أن يكون الطلب جلسة دردشة تفاعلية مستمرة مؤهلة

راجع [Active Memory](/ar/concepts/active-memory) لمعرفة نموذج التفعيل، والإعدادات المملوكة للـ Plugin، واستمرارية النص، ونمط الطرح الآمن.
</Note>

---

## اختيار المزوّد

| المفتاح     | النوع      | الافتراضي            | الوصف                                                                                                                                                                                                                               |
| ----------- | ---------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`  | `string`   | مكتشف تلقائياً       | معرّف محوّل التضمين مثل `bedrock` أو `deepinfra` أو `gemini` أو `github-copilot` أو `local` أو `mistral` أو `ollama` أو `openai` أو `voyage`؛ ويمكن أيضاً أن يكون `models.providers.<id>` معداً يشير `api` فيه إلى أحد هذه المحوّلات |
| `model`     | `string`   | افتراضي المزوّد      | اسم نموذج التضمين                                                                                                                                                                                                                  |
| `fallback`  | `string`   | `"none"`             | معرّف المحوّل الاحتياطي عند فشل الأساسي                                                                                                                                                                                            |
| `enabled`   | `boolean`  | `true`               | تفعيل بحث الذاكرة أو تعطيله                                                                                                                                                                                                        |

### ترتيب الاكتشاف التلقائي

عندما لا يتم تعيين `provider`، يختار OpenClaw أول خيار متاح:

<Steps>
  <Step title="local">
    يُختار إذا كان `memorySearch.local.modelPath` معداً وكان الملف موجوداً.
  </Step>
  <Step title="github-copilot">
    يُختار إذا أمكن حل رمز GitHub Copilot المميز (متغير بيئة أو ملف تعريف مصادقة).
  </Step>
  <Step title="openai">
    يُختار إذا أمكن حل مفتاح OpenAI.
  </Step>
  <Step title="gemini">
    يُختار إذا أمكن حل مفتاح Gemini.
  </Step>
  <Step title="voyage">
    يُختار إذا أمكن حل مفتاح Voyage.
  </Step>
  <Step title="mistral">
    يُختار إذا أمكن حل مفتاح Mistral.
  </Step>
  <Step title="deepinfra">
    يُختار إذا أمكن حل مفتاح DeepInfra.
  </Step>
  <Step title="bedrock">
    يُختار إذا نجحت سلسلة بيانات اعتماد AWS SDK في الحل (دور المثيل، أو مفاتيح الوصول، أو الملف التعريفي، أو SSO، أو هوية الويب، أو الإعدادات المشتركة).
  </Step>
</Steps>

`ollama` مدعوم لكنه لا يُكتشف تلقائياً (عيّنه صراحةً).

### معرّفات المزوّدين المخصصة

يمكن أن يشير `memorySearch.provider` إلى إدخال `models.providers.<id>` مخصص. يحل OpenClaw مالك `api` لذلك المزوّد لمحوّل التضمين مع الحفاظ على معرّف المزوّد المخصص للتعامل مع نقطة النهاية والمصادقة وبادئة النموذج. يتيح ذلك للإعدادات متعددة وحدات GPU أو متعددة المضيفين تخصيص تضمينات الذاكرة لنقطة نهاية محلية محددة:

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

تتطلب التضمينات البعيدة مفتاح API. يستخدم Bedrock بدلاً من ذلك سلسلة بيانات اعتماد AWS SDK الافتراضية (أدوار المثيلات، وSSO، ومفاتيح الوصول).

| المزوّد        | متغير البيئة                                      | مفتاح الإعدادات                       |
| -------------- | -------------------------------------------------- | ------------------------------------- |
| Bedrock        | سلسلة بيانات اعتماد AWS                           | لا حاجة إلى مفتاح API                 |
| DeepInfra      | `DEEPINFRA_API_KEY`                                | `models.providers.deepinfra.apiKey`   |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`      |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | ملف تعريف مصادقة عبر تسجيل دخول الجهاز |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey`     |
| Ollama         | `OLLAMA_API_KEY` (عنصر نائب)                      | --                                    |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`      |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`      |

<Note>
يغطي OAuth الخاص بـ Codex الدردشة/الإكمالات فقط ولا يفي بطلبات التضمين.
</Note>

---

## إعداد نقطة النهاية البعيدة

لنقاط النهاية المخصصة المتوافقة مع OpenAI أو لتجاوز افتراضيات المزوّد:

<ParamField path="remote.baseUrl" type="string">
  عنوان URL أساسي مخصص للـ API.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  تجاوز مفتاح API.
</ParamField>
<ParamField path="remote.headers" type="object">
  ترويسات HTTP إضافية (تُدمج مع افتراضيات المزوّد).
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

## إعدادات خاصة بالمزوّد

<AccordionGroup>
  <Accordion title="Gemini">
    | المفتاح                 | النوع    | الافتراضي              | الوصف                                     |
    | ----------------------- | -------- | ---------------------- | ----------------------------------------- |
    | `model`                 | `string` | `gemini-embedding-001` | يدعم أيضاً `gemini-embedding-2-preview`   |
    | `outputDimensionality`  | `number` | `3072`                 | لـ Embedding 2: 768 أو 1536 أو 3072       |

    <Warning>
    يؤدي تغيير النموذج أو `outputDimensionality` إلى إعادة فهرسة كاملة تلقائية.
    </Warning>

  </Accordion>
  <Accordion title="أنواع الإدخال المتوافقة مع OpenAI">
    يمكن لنقاط نهاية التضمين المتوافقة مع OpenAI الاشتراك في حقول طلب `input_type` الخاصة بالمزوّد. يكون ذلك مفيداً لنماذج التضمين غير المتماثلة التي تتطلب تسميات مختلفة لتضمينات الاستعلام والمستند.

    | المفتاح              | النوع    | الافتراضي | الوصف                                                    |
    | -------------------- | -------- | ---------- | -------------------------------------------------------- |
    | `inputType`          | `string` | غير معيّن  | `input_type` مشترك لتضمينات الاستعلام والمستند           |
    | `queryInputType`     | `string` | غير معيّن  | `input_type` وقت الاستعلام؛ يتجاوز `inputType`           |
    | `documentInputType`  | `string` | غير معيّن  | `input_type` للفهرس/المستند؛ يتجاوز `inputType`          |

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

    يؤثر تغيير هذه القيم في هوية ذاكرة التخزين المؤقت للتضمين لفهرسة دفعات المزوّد، وينبغي أن يتبعه إعادة فهرسة للذاكرة عندما يتعامل النموذج upstream مع التسميات بشكل مختلف.

  </Accordion>
  <Accordion title="Bedrock">
    ### إعداد تضمين Bedrock

    يستخدم Bedrock سلسلة بيانات اعتماد AWS SDK الافتراضية — لا حاجة إلى مفاتيح API. إذا كان OpenClaw يعمل على EC2 بدور مثيل مفعّل لـ Bedrock، فما عليك سوى تعيين المزوّد والنموذج:

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

    | المفتاح                 | النوع    | الافتراضي                     | الوصف                          |
    | ----------------------- | -------- | ----------------------------- | ------------------------------ |
    | `model`                 | `string` | `amazon.titan-embed-text-v2:0` | أي معرّف نموذج تضمين Bedrock   |
    | `outputDimensionality`  | `number` | افتراضي النموذج               | لـ Titan V2: 256 أو 512 أو 1024 |

    **النماذج المدعومة** (مع اكتشاف العائلة وافتراضيات الأبعاد):

    | معرّف النموذج                                | المزوّد    | الأبعاد الافتراضية | الأبعاد القابلة للإعداد |
    | -------------------------------------------- | ---------- | ------------------ | ----------------------- |
    | `amazon.titan-embed-text-v2:0`               | Amazon     | 1024               | 256, 512, 1024          |
    | `amazon.titan-embed-text-v1`                 | Amazon     | 1536               | --                      |
    | `amazon.titan-embed-g1-text-02`              | Amazon     | 1536               | --                      |
    | `amazon.titan-embed-image-v1`                | Amazon     | 1024               | --                      |
    | `amazon.nova-2-multimodal-embeddings-v1:0`   | Amazon     | 1024               | 256, 384, 1024, 3072    |
    | `cohere.embed-english-v3`                    | Cohere     | 1024               | --                      |
    | `cohere.embed-multilingual-v3`               | Cohere     | 1024               | --                      |
    | `cohere.embed-v4:0`                          | Cohere     | 1536               | 256-1536                |
    | `twelvelabs.marengo-embed-3-0-v1:0`          | TwelveLabs | 512                | --                      |
    | `twelvelabs.marengo-embed-2-7-v1:0`          | TwelveLabs | 1024               | --                      |

    ترث المتغيرات ذات لاحقة معدل النقل (مثل `amazon.titan-embed-text-v1:2:8k`) إعدادات النموذج الأساسي.

    **المصادقة:** تستخدم مصادقة Bedrock ترتيب حل بيانات اعتماد AWS SDK القياسي:

    1. متغيرات البيئة (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. ذاكرة التخزين المؤقت لرمز SSO المميز
    3. بيانات اعتماد رمز هوية الويب
    4. بيانات الاعتماد المشتركة وملفات الإعدادات
    5. بيانات اعتماد بيانات ECS أو EC2 الوصفية

    تُحل المنطقة من `AWS_REGION` أو `AWS_DEFAULT_REGION` أو `baseUrl` الخاص بمزوّد `amazon-bedrock`، أو تكون افتراضياً `us-east-1`.

    **أذونات IAM:** يحتاج دور IAM أو المستخدم إلى:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    للحد الأدنى من الصلاحيات، قيّد `InvokeModel` بالنموذج المحدد:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="محلي (GGUF + node-llama-cpp)">
    | المفتاح              | النوع              | الافتراضي                | الوصف                                                                                                                                                                                                                                                                                                          |
    | --------------------- | ------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | يُنزّل تلقائيًا        | المسار إلى ملف نموذج GGUF                                                                                                                                                                                                                                                                                              |
    | `local.modelCacheDir` | `string`           | الافتراضي لـ node-llama-cpp | دليل التخزين المؤقت للنماذج المنزّلة                                                                                                                                                                                                                                                                                      |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | حجم نافذة السياق لسياق التضمين. يغطي 4096 المقاطع النموذجية (128–512 رمزًا مميزًا) مع ضبط ذاكرة VRAM غير الخاصة بالأوزان. خفّضه إلى 1024–2048 على المضيفات محدودة الموارد. يستخدم `"auto"` الحد الأقصى الذي دُرّب عليه النموذج — لا يوصى به لنماذج 8B+ (Qwen3-Embedding-8B: 40 960 رمزًا مميزًا → نحو 32 GB VRAM مقابل نحو 8.8 GB عند 4096). |

    النموذج الافتراضي: `embeddinggemma-300m-qat-Q8_0.gguf` (نحو 0.6 GB، يُنزّل تلقائيًا). لا تزال نسخ المصدر تتطلب موافقة البناء الأصلي: `pnpm approve-builds` ثم `pnpm rebuild node-llama-cpp`.

    استخدم CLI المستقل للتحقق من مسار المزوّد نفسه الذي يستخدمه Gateway:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    إذا كان `provider` هو `auto`، فلن يُختار `local` إلا عندما يشير `local.modelPath` إلى ملف محلي موجود. لا يزال من الممكن استخدام مراجع نماذج `hf:` وHTTP(S) صراحةً مع `provider: "local"`، لكنها لا تجعل `auto` يختار المحلي قبل أن يصبح النموذج متاحًا على القرص.

  </Accordion>
</AccordionGroup>

### مهلة التضمين المضمّن

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  تجاوز المهلة لدُفعات التضمين المضمّنة أثناء فهرسة الذاكرة.

عند عدم الضبط، يُستخدم الافتراضي الخاص بالمزوّد: 600 ثانية للمزوّدين المحليين/المستضافين ذاتيًا مثل `local` و`ollama` و`lmstudio`، و120 ثانية للمزوّدين المستضافين. زد هذه القيمة عندما تكون دُفعات التضمين المحلية المعتمدة على CPU سليمة لكنها بطيئة.
</ParamField>

---

## إعداد البحث الهجين

كلها ضمن `memorySearch.query.hybrid`:

| المفتاح              | النوع     | الافتراضي | الوصف                              |
| --------------------- | --------- | ------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`  | تفعيل البحث الهجين BM25 + المتجهي |
| `vectorWeight`        | `number`  | `0.7`   | وزن درجات المتجهات (0-1)          |
| `textWeight`          | `number`  | `0.3`   | وزن درجات BM25 (0-1)              |
| `candidateMultiplier` | `number`  | `4`     | معامل مضاعفة حجم مجموعة المرشحين  |

<Tabs>
  <Tab title="MMR (التنوع)">
    | المفتاح       | النوع     | الافتراضي | الوصف                                  |
    | ------------- | --------- | ------- | ------------------------------------ |
    | `mmr.enabled` | `boolean` | `false` | تفعيل إعادة الترتيب باستخدام MMR      |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = أقصى تنوع، 1 = أقصى صلة          |
  </Tab>
  <Tab title="التلاشي الزمني (الحداثة)">
    | المفتاح                     | النوع     | الافتراضي | الوصف                    |
    | ---------------------------- | --------- | ------- | ------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | تفعيل تعزيز الحداثة       |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | تنخفض الدرجة إلى النصف كل N يومًا |

    لا تخضع الملفات دائمة الصلاحية (`MEMORY.md` والملفات غير المؤرخة في `memory/`) للتلاشي أبدًا.

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

| المفتاح     | النوع      | الوصف                                      |
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

يمكن أن تكون المسارات مطلقة أو نسبية إلى مساحة العمل. تُفحص الأدلة تكراريًا بحثًا عن ملفات `.md`. يعتمد التعامل مع الروابط الرمزية على الخلفية النشطة: يتجاهل المحرك المدمج الروابط الرمزية، بينما يتبع QMD سلوك ماسح QMD الأساسي.

للبحث في نصوص وكلاء آخرين ضمن نطاق وكيل، استخدم `agents.list[].memorySearch.qmd.extraCollections` بدلًا من `memory.qmd.paths`. تتبع تلك المجموعات الإضافية البنية نفسها `{ path, name, pattern? }`، لكنها تُدمج لكل وكيل ويمكنها الحفاظ على الأسماء المشتركة الصريحة عندما يشير المسار إلى خارج مساحة العمل الحالية. إذا ظهر المسار المحلول نفسه في كل من `memory.qmd.paths` و`memorySearch.qmd.extraCollections`، يحتفظ QMD بالإدخال الأول ويتخطى التكرار.

---

## الذاكرة متعددة الوسائط (Gemini)

افهرس الصور والصوت إلى جانب Markdown باستخدام Gemini Embedding 2:

| المفتاح                  | النوع      | الافتراضي | الوصف                                  |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | تفعيل الفهرسة متعددة الوسائط           |
| `multimodal.modalities`   | `string[]` | --         | `["image"]` أو `["audio"]` أو `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | الحد الأقصى لحجم الملف للفهرسة         |

<Note>
ينطبق فقط على الملفات في `extraPaths`. تبقى جذور الذاكرة الافتراضية مخصصة لـ Markdown فقط. يتطلب `gemini-embedding-2-preview`. يجب أن يكون `fallback` هو `"none"`.
</Note>

التنسيقات المدعومة: `.jpg`، `.jpeg`، `.png`، `.webp`، `.gif`، `.heic`، `.heif` (صور)؛ `.mp3`، `.wav`، `.ogg`، `.opus`، `.m4a`، `.aac`، `.flac` (صوت).

---

## ذاكرة التخزين المؤقت للتضمينات

| المفتاح           | النوع     | الافتراضي | الوصف                              |
| ----------------- | --------- | --------- | ---------------------------------- |
| `cache.enabled`    | `boolean` | `false`   | تخزين تضمينات المقاطع مؤقتا في SQLite |
| `cache.maxEntries` | `number`  | `50000`   | الحد الأقصى للتضمينات المخزنة مؤقتا |

يمنع إعادة تضمين النص غير المتغير أثناء إعادة الفهرسة أو تحديثات النصوص المسجلة.

---

## الفهرسة الدفعية

| المفتاح                      | النوع     | الافتراضي | الوصف                    |
| ---------------------------- | --------- | --------- | ------------------------ |
| `remote.nonBatchConcurrency`  | `number`  | `4`       | تضمينات مضمّنة متوازية   |
| `remote.batch.enabled`        | `boolean` | `false`   | تفعيل API التضمين الدفعي |
| `remote.batch.concurrency`    | `number`  | `2`       | مهام دفعية متوازية       |
| `remote.batch.wait`           | `boolean` | `true`    | انتظار اكتمال الدفعة     |
| `remote.batch.pollIntervalMs` | `number`  | --        | فاصل الاستطلاع           |
| `remote.batch.timeoutMinutes` | `number`  | --        | مهلة الدفعة              |

متاحة لـ `openai` و`gemini` و`voyage`. تكون دفعات OpenAI عادة الأسرع والأقل تكلفة لعمليات الملء الخلفي الكبيرة.

يتحكم `remote.nonBatchConcurrency` في استدعاءات التضمين المضمّنة التي يستخدمها المزوّدون المحليون/المستضافون ذاتيا والمزوّدون المستضافون عندما لا تكون واجهات API الدفعية الخاصة بالمزوّد نشطة. القيمة الافتراضية لـ Ollama هي `1` للفهرسة غير الدفعية لتجنب إرباك المضيفين المحليين الأصغر؛ اضبط قيمة أعلى على الأجهزة الأكبر.

هذا منفصل عن `sync.embeddingBatchTimeoutSeconds`، الذي يتحكم في مهلة استدعاءات التضمين المضمّنة.

---

## بحث ذاكرة الجلسات (تجريبي)

افهرس نصوص الجلسات المسجلة واعرضها عبر `memory_search`:

| المفتاح                      | النوع      | الافتراضي | الوصف                                  |
| ---------------------------- | ---------- | --------- | -------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`   | تفعيل فهرسة الجلسات                    |
| `sources`                     | `string[]` | `["memory"]` | أضف `"sessions"` لتضمين النصوص المسجلة |
| `sync.sessions.deltaBytes`    | `number`   | `100000`  | عتبة البايتات لإعادة الفهرسة           |
| `sync.sessions.deltaMessages` | `number`   | `50`      | عتبة الرسائل لإعادة الفهرسة            |

<Warning>
فهرسة الجلسات اختيارية وتعمل بشكل غير متزامن. قد تكون النتائج قديمة قليلا. توجد سجلات الجلسات على القرص، لذا تعامل مع الوصول إلى نظام الملفات باعتباره حد الثقة.
</Warning>

---

## تسريع متجهات SQLite (sqlite-vec)

| المفتاح                     | النوع     | الافتراضي | الوصف                                  |
| --------------------------- | --------- | --------- | -------------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`    | استخدام sqlite-vec لاستعلامات المتجهات |
| `store.vector.extensionPath` | `string`  | مضمّن     | تجاوز مسار sqlite-vec                  |

عندما لا يكون sqlite-vec متاحا، يعود OpenClaw تلقائيا إلى تشابه جيب التمام داخل العملية.

---

## تخزين الفهرس

| المفتاح              | النوع    | الافتراضي                            | الوصف                                      |
| -------------------- | -------- | ------------------------------------ | ------------------------------------------ |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | موقع الفهرس (يدعم الرمز `{agentId}`)       |
| `store.fts.tokenizer` | `string` | `unicode61`                          | مجزئ FTS5 (`unicode61` أو `trigram`)       |

---

## إعداد واجهة QMD الخلفية

اضبط `memory.backend = "qmd"` للتفعيل. توجد كل إعدادات QMD ضمن `memory.qmd`:

| المفتاح                 | النوع     | الافتراضي | الوصف                                                                                 |
| ----------------------- | --------- | --------- | ------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`     | مسار ملف QMD التنفيذي؛ اضبط مسارا مطلقا عندما يختلف `PATH` الخاص بالخدمة عن صدفتك     |
| `searchMode`             | `string`  | `search`  | أمر البحث: `search`، `vsearch`، `query`                                                |
| `includeDefaultMemory`   | `boolean` | `true`    | فهرسة تلقائية لـ `MEMORY.md` + `memory/**/*.md`                                       |
| `paths[]`                | `array`   | --        | مسارات إضافية: `{ name, path, pattern? }`                                             |
| `sessions.enabled`       | `boolean` | `false`   | فهرسة نصوص الجلسات المسجلة                                                            |
| `sessions.retentionDays` | `number`  | --        | احتفاظ النصوص المسجلة                                                                  |
| `sessions.exportDir`     | `string`  | --        | دليل التصدير                                                                           |

`searchMode: "search"` معجمي/BM25 فقط. لا يُجري OpenClaw مجسات جاهزية المتجهات الدلالية أو صيانة تضمينات QMD لهذا الوضع، بما في ذلك أثناء `memory status --deep`؛ يواصل `vsearch` و`query` طلب جاهزية متجهات QMD والتضمينات.

يفضل OpenClaw مجموعة QMD الحالية وأشكال استعلام MCP، لكنه يُبقي إصدارات QMD الأقدم عاملة عبر تجربة أعلام أنماط المجموعات المتوافقة وأسماء أدوات MCP الأقدم عند الحاجة. عندما يعلن QMD دعمه لعدة مرشحات مجموعات، تُبحث مجموعات المصدر نفسه باستخدام عملية QMD واحدة؛ وتحتفظ إصدارات QMD الأقدم بمسار التوافق لكل مجموعة. يعني المصدر نفسه أن مجموعات الذاكرة الدائمة تُجمّع معا، بينما تبقى مجموعات نصوص الجلسات مجموعة منفصلة بحيث يظل تنويع المصادر يتضمن كلا المُدخلين.

<Note>
تبقى تجاوزات نماذج QMD في جانب QMD، وليس في إعدادات OpenClaw. إذا احتجت إلى تجاوز نماذج QMD عالميا، فعيّن متغيرات بيئة مثل `QMD_EMBED_MODEL` و`QMD_RERANK_MODEL` و`QMD_GENERATE_MODEL` في بيئة تشغيل Gateway.
</Note>

<AccordionGroup>
  <Accordion title="جدول التحديث">
    | Key                       | Type      | Default | Description                           |
    | ------------------------- | --------- | ------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | فاصل التحديث                          |
    | `update.debounceMs`       | `number`  | `15000` | إزالة ارتداد تغييرات الملفات          |
    | `update.onBoot`           | `boolean` | `true`  | التحديث عند فتح مدير QMD طويل العمر؛ ويتحكم أيضا في تحديث بدء التشغيل الاختياري |
    | `update.startup`          | `string`  | `off`   | تحديث اختياري عند بدء Gateway: `off` أو `idle` أو `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | تأخير قبل تشغيل تحديث `startup: "idle"` |
    | `update.waitForBootSync`  | `boolean` | `false` | حظر فتح المدير حتى يكتمل تحديثه الأولي |
    | `update.embedInterval`    | `string`  | --      | إيقاع تضمين منفصل                    |
    | `update.commandTimeoutMs` | `number`  | --      | مهلة أوامر QMD                       |
    | `update.updateTimeoutMs`  | `number`  | --      | مهلة عمليات تحديث QMD                |
    | `update.embedTimeoutMs`   | `number`  | --      | مهلة عمليات تضمين QMD                |
  </Accordion>
  <Accordion title="الحدود">
    | Key                       | Type     | Default | Description                |
    | ------------------------- | -------- | ------- | -------------------------- |
    | `limits.maxResults`       | `number` | `6`     | الحد الأقصى لنتائج البحث   |
    | `limits.maxSnippetChars`  | `number` | --      | تقييد طول المقتطف          |
    | `limits.maxInjectedChars` | `number` | --      | تقييد إجمالي الأحرف المحقونة |
    | `limits.timeoutMs`        | `number` | `4000`  | مهلة البحث                 |
  </Accordion>
  <Accordion title="النطاق">
    يتحكم في الجلسات التي يمكنها تلقي نتائج بحث QMD. المخطط نفسه مثل [`session.sendPolicy`](/ar/gateway/config-agents#session):

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

    يسمح الافتراضي المشحون بجلسات الرسائل المباشرة والقنوات، مع الاستمرار في رفض المجموعات.

    الافتراضي هو الرسائل المباشرة فقط. يطابق `match.keyPrefix` مفتاح الجلسة المطبّع؛ ويطابق `match.rawKeyPrefix` المفتاح الخام بما في ذلك `agent:<id>:`.

  </Accordion>
  <Accordion title="الاستشهادات">
    ينطبق `memory.citations` على كل الخلفيات:

    | Value            | Behavior                                            |
    | ---------------- | --------------------------------------------------- |
    | `auto` (default) | تضمين تذييل `Source: <path#line>` في المقتطفات      |
    | `on`             | تضمين التذييل دائما                                |
    | `off`            | حذف التذييل (يظل المسار مررا إلى الوكيل داخليا)     |

  </Accordion>
</AccordionGroup>

تستخدم تحديثات إقلاع QMD مسار عملية فرعية لمرة واحدة أثناء بدء Gateway. يظل مدير QMD طويل العمر مالكا لمراقب الملفات العادي ومؤقتات الفواصل عندما يُفتح بحث الذاكرة للاستخدام التفاعلي.

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

يعمل Dreaming كعملية مسح مجدولة واحدة، ويستخدم مراحل داخلية خفيفة/عميقة/REM كتفصيل تنفيذي.

للسلوك المفاهيمي وأوامر slash، راجع [Dreaming](/ar/concepts/dreaming).

### إعدادات المستخدم

| Key         | Type      | Default       | Description                                       |
| ----------- | --------- | ------------- | ------------------------------------------------- |
| `enabled`   | `boolean` | `false`       | تفعيل Dreaming أو تعطيله بالكامل                 |
| `frequency` | `string`  | `0 3 * * *`   | إيقاع Cron اختياري لمسح Dreaming الكامل          |
| `model`     | `string`  | النموذج الافتراضي | تجاوز اختياري لنموذج الوكيل الفرعي Dream Diary |

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
- يكتب Dreaming المخرجات السردية القابلة للقراءة البشرية إلى `DREAMS.md` (أو `dreams.md` الموجود).
- يستخدم `dreaming.model` بوابة الثقة الحالية للوكيل الفرعي في Plugin؛ عيّن `plugins.entries.memory-core.subagent.allowModelOverride: true` قبل تفعيله.
- يعيد Dream Diary المحاولة مرة واحدة باستخدام نموذج الجلسة الافتراضي عندما يكون النموذج المضبوط غير متاح. تُسجل إخفاقات الثقة أو قائمة السماح ولا يُعاد المحاولة بصمت.
- سياسة مراحل light/deep/REM والعتبات سلوك داخلي، وليست إعدادات موجهة للمستخدم.

</Note>

## ذات صلة

- [مرجع الإعدادات](/ar/gateway/configuration-reference)
- [نظرة عامة على الذاكرة](/ar/concepts/memory)
- [بحث الذاكرة](/ar/concepts/memory-search)
