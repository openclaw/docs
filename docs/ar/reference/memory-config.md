---
read_when:
    - تريد تهيئة موفري بحث الذاكرة أو نماذج التضمين
    - تريد إعداد الواجهة الخلفية لـ QMD
    - تريد ضبط البحث الهجين أو MMR أو الاضمحلال الزمني
    - تريد تمكين فهرسة الذاكرة متعددة الوسائط
sidebarTitle: Memory config
summary: جميع خيارات التهيئة للبحث في الذاكرة، ومزوّدي التضمينات، وQMD، والبحث الهجين، والفهرسة متعددة الوسائط
title: مرجع إعدادات الذاكرة
x-i18n:
    generated_at: "2026-04-30T16:30:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 58b75751a19afb883fd7646cf5f71859f95bac468b2bfd8cc79db12ae892f70f
    source_path: reference/memory-config.md
    workflow: 16
---

تعرض هذه الصفحة كل خيار تكوين لبحث الذاكرة في OpenClaw. للاطلاع على النظرات العامة المفاهيمية، راجع:

<CardGroup cols={2}>
  <Card title="نظرة عامة على الذاكرة" href="/ar/concepts/memory">
    كيفية عمل الذاكرة.
  </Card>
  <Card title="المحرك المدمج" href="/ar/concepts/memory-builtin">
    الواجهة الخلفية الافتراضية SQLite.
  </Card>
  <Card title="محرك QMD" href="/ar/concepts/memory-qmd">
    مكون جانبي محلي أولا.
  </Card>
  <Card title="بحث الذاكرة" href="/ar/concepts/memory-search">
    خط معالجة البحث وضبطه.
  </Card>
  <Card title="Active Memory" href="/ar/concepts/active-memory">
    وكيل فرعي للذاكرة في الجلسات التفاعلية.
  </Card>
</CardGroup>

توجد كل إعدادات بحث الذاكرة ضمن `agents.defaults.memorySearch` في `openclaw.json` ما لم يذكر خلاف ذلك.

<Note>
إذا كنت تبحث عن مفتاح تفعيل ميزة **Active Memory** وتكوين الوكيل الفرعي، فهذا يوجد ضمن `plugins.entries.active-memory` بدلا من `memorySearch`.

تستخدم Active Memory نموذجا ببوابتين:

1. يجب تمكين Plugin واستهداف معرف الوكيل الحالي
2. يجب أن يكون الطلب جلسة محادثة تفاعلية مستمرة مؤهلة

راجع [Active Memory](/ar/concepts/active-memory) لمعرفة نموذج التفعيل، والتكوين المملوك للـ Plugin، واستمرارية النصوص، ونمط الطرح الآمن.
</Note>

---

## اختيار المزود

| المفتاح   | النوع     | الافتراضي              | الوصف                                                                                                                                                                                                                            |
| ---------- | --------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | مكتشف تلقائيا          | معرف محول التضمين مثل `bedrock` أو `deepinfra` أو `gemini` أو `github-copilot` أو `local` أو `mistral` أو `ollama` أو `openai` أو `voyage`؛ ويمكن أيضا أن يكون `models.providers.<id>` مكونا يشير `api` فيه إلى أحد تلك المحولات |
| `model`    | `string`  | افتراضي المزود         | اسم نموذج التضمين                                                                                                                                                                                                               |
| `fallback` | `string`  | `"none"`               | معرف محول الرجوع الاحتياطي عند فشل الأساسي                                                                                                                                                                                     |
| `enabled`  | `boolean` | `true`                 | تمكين بحث الذاكرة أو تعطيله                                                                                                                                                                                                     |

### ترتيب الاكتشاف التلقائي

عند عدم ضبط `provider`، يختار OpenClaw أول خيار متاح:

<Steps>
  <Step title="local">
    يتم اختياره إذا كان `memorySearch.local.modelPath` مكونا وكان الملف موجودا.
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
    يتم اختياره إذا نجحت سلسلة بيانات اعتماد AWS SDK في الحل (دور مثيل، أو مفاتيح وصول، أو ملف تعريف، أو SSO، أو هوية ويب، أو تكوين مشترك).
  </Step>
</Steps>

`ollama` مدعوم لكنه لا يكتشف تلقائيا (اضبطه صراحة).

### معرفات المزود المخصصة

يمكن أن يشير `memorySearch.provider` إلى إدخال `models.providers.<id>` مخصص. يحل OpenClaw مالك `api` لذلك المزود من أجل محول التضمين مع الحفاظ على معرف المزود المخصص لمعالجة نقطة النهاية والمصادقة وبادئة النموذج. يتيح هذا لإعدادات متعددة وحدات GPU أو متعددة المضيفين تخصيص تضمينات الذاكرة لنقطة نهاية محلية محددة:

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

### حل مفاتيح API

تتطلب التضمينات البعيدة مفتاح API. يستخدم Bedrock سلسلة بيانات اعتماد AWS SDK الافتراضية بدلا من ذلك (أدوار المثيلات، SSO، مفاتيح الوصول).

| المزود         | متغير البيئة                                      | مفتاح التكوين                       |
| -------------- | -------------------------------------------------- | ----------------------------------- |
| Bedrock        | سلسلة بيانات اعتماد AWS                           | لا حاجة إلى مفتاح API               |
| DeepInfra      | `DEEPINFRA_API_KEY`                                | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | ملف تعريف المصادقة عبر تسجيل دخول الجهاز |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (عنصر نائب)                       | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`    |

<Note>
يغطي Codex OAuth المحادثة والإكمالات فقط، ولا يفي بطلبات التضمين.
</Note>

---

## تكوين نقطة النهاية البعيدة

لنقاط النهاية المخصصة المتوافقة مع OpenAI أو لتجاوز افتراضيات المزود:

<ParamField path="remote.baseUrl" type="string">
  عنوان URL أساسي مخصص لـ API.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  تجاوز مفتاح API.
</ParamField>
<ParamField path="remote.headers" type="object">
  رؤوس HTTP إضافية (مدمجة مع افتراضيات المزود).
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

## تكوين خاص بالمزود

<AccordionGroup>
  <Accordion title="Gemini">
    | المفتاح               | النوع    | الافتراضي             | الوصف                                      |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | يدعم أيضا `gemini-embedding-2-preview`     |
    | `outputDimensionality` | `number` | `3072`                 | لـ Embedding 2: 768، 1536، أو 3072         |

    <Warning>
    يؤدي تغيير النموذج أو `outputDimensionality` إلى إعادة فهرسة كاملة تلقائية.
    </Warning>

  </Accordion>
  <Accordion title="أنواع إدخال متوافقة مع OpenAI">
    يمكن لنقاط نهاية التضمين المتوافقة مع OpenAI الاشتراك في حقول طلب `input_type` الخاصة بالمزود. هذا مفيد لنماذج التضمين غير المتماثلة التي تتطلب تسميات مختلفة لتضمينات الاستعلام والمستندات.

    | المفتاح             | النوع    | الافتراضي | الوصف                                                |
    | ------------------- | -------- | --------- | ---------------------------------------------------- |
    | `inputType`         | `string` | غير مضبوط | `input_type` مشترك لتضمينات الاستعلام والمستندات     |
    | `queryInputType`    | `string` | غير مضبوط | `input_type` وقت الاستعلام؛ يتجاوز `inputType`       |
    | `documentInputType` | `string` | غير مضبوط | `input_type` للفهرس/المستند؛ يتجاوز `inputType`      |

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

    يؤثر تغيير هذه القيم في هوية ذاكرة التضمين المؤقتة لفهرسة دفعات المزود، وينبغي أن تتبعه إعادة فهرسة للذاكرة عندما يتعامل النموذج upstream مع التسميات بشكل مختلف.

  </Accordion>
  <Accordion title="Bedrock">
    يستخدم Bedrock سلسلة بيانات اعتماد AWS SDK الافتراضية، ولا حاجة إلى مفاتيح API. إذا كان OpenClaw يعمل على EC2 بدور مثيل مفعل لـ Bedrock، فما عليك سوى ضبط المزود والنموذج:

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

    | المفتاح               | النوع    | الافتراضي                     | الوصف                         |
    | ---------------------- | -------- | ------------------------------ | ----------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | أي معرف نموذج تضمين في Bedrock |
    | `outputDimensionality` | `number` | افتراضي النموذج                | لـ Titan V2: 256، 512، أو 1024 |

    **النماذج المدعومة** (مع اكتشاف العائلة وافتراضيات الأبعاد):

    | معرف النموذج                              | المزود     | الأبعاد الافتراضية | الأبعاد القابلة للتكوين |
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
    2. ذاكرة التخزين المؤقت لرمز SSO
    3. بيانات اعتماد رمز هوية الويب
    4. ملفات بيانات الاعتماد والتكوين المشتركة
    5. بيانات اعتماد بيانات وصفية لـ ECS أو EC2

    يتم حل المنطقة من `AWS_REGION` أو `AWS_DEFAULT_REGION` أو `baseUrl` لمزود `amazon-bedrock`، أو يتم ضبطها افتراضيا على `us-east-1`.

    **أذونات IAM:** يحتاج دور IAM أو المستخدم إلى:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    للحد الأدنى من الامتيازات، قيد نطاق `InvokeModel` بالنموذج المحدد:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Local (GGUF + node-llama-cpp)">
    | Key                   | Type               | Default                | Description                                                                                                                                                                                                                                                                                                          |
    | --------------------- | ------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | auto-downloaded        | المسار إلى ملف نموذج GGUF                                                                                                                                                                                                                                                                                              |
    | `local.modelCacheDir` | `string`           | node-llama-cpp default | دليل التخزين المؤقت للنماذج التي تم تنزيلها                                                                                                                                                                                                                                                                                      |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | حجم نافذة السياق لسياق التضمين. يغطي 4096 المقاطع المعتادة (128-512 رمزًا) مع ضبط ذاكرة VRAM غير الخاصة بالأوزان. خفّضه إلى 1024-2048 على المضيفات محدودة الموارد. يستخدم `"auto"` الحد الأقصى الذي دُرّب عليه النموذج، ولا يُنصح به لنماذج 8B+ (Qwen3-Embedding-8B: 40 960 رمزًا -> نحو 32 GB من VRAM مقابل نحو 8.8 GB عند 4096). |

    النموذج الافتراضي: `embeddinggemma-300m-qat-Q8_0.gguf` (نحو 0.6 GB، يتم تنزيله تلقائيًا). تصلح التثبيتات المعبأة وقت تشغيل `node-llama-cpp` الأصلي عبر تبعيات وقت تشغيل Plugin المُدارة عند تكوين `provider: "local"`. لا تزال نسخ المصدر تتطلب الموافقة على البناء الأصلي: `pnpm approve-builds` ثم `pnpm rebuild node-llama-cpp`.

    استخدم CLI المستقل للتحقق من مسار المزوّد نفسه الذي يستخدمه Gateway:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    إذا كان `provider` هو `auto`، فلن يتم اختيار `local` إلا عندما يشير `local.modelPath` إلى ملف محلي موجود. لا يزال من الممكن استخدام مراجع نماذج `hf:` وHTTP(S) صراحةً مع `provider: "local"`، لكنها لا تجعل `auto` يختار المحلي قبل توفر النموذج على القرص.

  </Accordion>
</AccordionGroup>

### مهلة التضمين المضمّن

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  تجاوز المهلة لدُفعات التضمين المضمّنة أثناء فهرسة الذاكرة.

تستخدم القيمة غير المضبوطة افتراضي المزوّد: 600 ثانية للمزوّدين المحليين/ذوي الاستضافة الذاتية مثل `local` و`ollama` و`lmstudio`، و120 ثانية للمزوّدين المستضافين. زد هذه القيمة عندما تكون دُفعات التضمين المحلية المعتمدة على وحدة المعالجة المركزية سليمة لكنها بطيئة.
</ParamField>

---

## تكوين البحث الهجين

كلها تحت `memorySearch.query.hybrid`:

| Key                   | Type      | Default | Description                        |
| --------------------- | --------- | ------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`  | تفعيل البحث الهجين BM25 + المتجهي |
| `vectorWeight`        | `number`  | `0.7`   | وزن درجات البحث المتجهي (0-1)     |
| `textWeight`          | `number`  | `0.3`   | وزن درجات BM25 (0-1)       |
| `candidateMultiplier` | `number`  | `4`     | مضاعِف حجم مجموعة المرشحين     |

<Tabs>
  <Tab title="MMR (diversity)">
    | Key           | Type      | Default | Description                          |
    | ------------- | --------- | ------- | ------------------------------------ |
    | `mmr.enabled` | `boolean` | `false` | تفعيل إعادة الترتيب باستخدام MMR                |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = أقصى تنوع، 1 = أقصى صلة |
  </Tab>
  <Tab title="Temporal decay (recency)">
    | Key                          | Type      | Default | Description               |
    | ---------------------------- | --------- | ------- | ------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | تفعيل تعزيز الحداثة      |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | تنخفض الدرجة إلى النصف كل N يومًا |

    لا تخضع الملفات الدائمة (`MEMORY.md`، والملفات غير المؤرخة في `memory/`) للتلاشي أبدًا.

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

| Key          | Type       | Description                              |
| ------------ | ---------- | ---------------------------------------- |
| `extraPaths` | `string[]` | أدلة أو ملفات إضافية للفهرسة |

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

يمكن أن تكون المسارات مطلقة أو نسبية إلى مساحة العمل. تُفحص الأدلة تكراريًا بحثًا عن ملفات `.md`. يعتمد التعامل مع الروابط الرمزية على الخلفية النشطة: يتجاهل المحرك المضمّن الروابط الرمزية، بينما يتبع QMD سلوك ماسح QMD الأساسي.

للبحث في نصوص جلسات الوكلاء الآخرين ضمن نطاق الوكيل، استخدم `agents.list[].memorySearch.qmd.extraCollections` بدلًا من `memory.qmd.paths`. تتبع هذه المجموعات الإضافية الشكل نفسه `{ path, name, pattern? }`، لكنها تُدمج لكل وكيل ويمكنها الاحتفاظ بالأسماء المشتركة الصريحة عندما يشير المسار إلى خارج مساحة العمل الحالية. إذا ظهر المسار المحلول نفسه في كل من `memory.qmd.paths` و`memorySearch.qmd.extraCollections`، يحتفظ QMD بالإدخال الأول ويتخطى التكرار.

---

## الذاكرة متعددة الوسائط (Gemini)

افهرس الصور والصوت إلى جانب Markdown باستخدام Gemini Embedding 2:

| Key                       | Type       | Default    | Description                            |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | تفعيل الفهرسة متعددة الوسائط             |
| `multimodal.modalities`   | `string[]` | --         | `["image"]` أو `["audio"]` أو `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | الحد الأقصى لحجم الملف للفهرسة             |

<Note>
ينطبق فقط على الملفات في `extraPaths`. تبقى جذور الذاكرة الافتراضية مقتصرة على Markdown. يتطلب `gemini-embedding-2-preview`. يجب أن يكون `fallback` هو `"none"`.
</Note>

التنسيقات المدعومة: `.jpg`، `.jpeg`، `.png`، `.webp`، `.gif`، `.heic`، `.heif` (صور)؛ `.mp3`، `.wav`، `.ogg`، `.opus`، `.m4a`، `.aac`، `.flac` (صوت).

---

## ذاكرة التضمينات المؤقتة

| Key                | Type      | Default | Description                      |
| ------------------ | --------- | ------- | -------------------------------- |
| `cache.enabled`    | `boolean` | `false` | تخزين تضمينات المقاطع مؤقتًا في SQLite |
| `cache.maxEntries` | `number`  | `50000` | الحد الأقصى للتضمينات المخزنة مؤقتًا            |

يمنع إعادة تضمين النص غير المتغير أثناء إعادة الفهرسة أو تحديثات النصوص.

---

## الفهرسة الدُفعية

| Key                           | Type      | Default | Description                |
| ----------------------------- | --------- | ------- | -------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`     | تضمينات مضمّنة متوازية |
| `remote.batch.enabled`        | `boolean` | `false` | تفعيل واجهة API للتضمين الدُفعي |
| `remote.batch.concurrency`    | `number`  | `2`     | مهام دُفعية متوازية        |
| `remote.batch.wait`           | `boolean` | `true`  | انتظار اكتمال الدُفعة  |
| `remote.batch.pollIntervalMs` | `number`  | --      | فاصل الاستطلاع              |
| `remote.batch.timeoutMinutes` | `number`  | --      | مهلة الدُفعة              |

متاح لـ `openai` و`gemini` و`voyage`. عادةً ما تكون دُفعات OpenAI الأسرع والأرخص لعمليات الملء الخلفي الكبيرة.

يتحكم `remote.nonBatchConcurrency` في استدعاءات التضمين المضمّنة التي يستخدمها المزوّدون المحليون/ذوو الاستضافة الذاتية والمزوّدون المستضافون عندما لا تكون واجهات API للدُفعات الخاصة بالمزوّد نشطة. يكون افتراضي Ollama هو `1` للفهرسة غير الدُفعية لتجنب إرهاق المضيفات المحلية الأصغر؛ اضبط قيمة أعلى على الأجهزة الأكبر.

هذا منفصل عن `sync.embeddingBatchTimeoutSeconds`، الذي يتحكم في مهلة استدعاءات التضمين المضمّنة.

---

## البحث في ذاكرة الجلسة (تجريبي)

افهرس نصوص الجلسات واعرضها عبر `memory_search`:

| Key                           | Type       | Default      | Description                             |
| ----------------------------- | ---------- | ------------ | --------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | تفعيل فهرسة الجلسات                 |
| `sources`                     | `string[]` | `["memory"]` | أضف `"sessions"` لتضمين النصوص |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | عتبة البايت لإعادة الفهرسة              |
| `sync.sessions.deltaMessages` | `number`   | `50`         | عتبة الرسائل لإعادة الفهرسة           |

<Warning>
فهرسة الجلسات اختيارية وتعمل بشكل غير متزامن. يمكن أن تكون النتائج قديمة قليلًا. توجد سجلات الجلسات على القرص، لذلك تعامل مع الوصول إلى نظام الملفات على أنه حد الثقة.
</Warning>

---

## تسريع المتجهات في SQLite (sqlite-vec)

| Key                          | Type      | Default | Description                       |
| ---------------------------- | --------- | ------- | --------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | استخدام sqlite-vec لاستعلامات المتجهات |
| `store.vector.extensionPath` | `string`  | bundled | تجاوز مسار sqlite-vec          |

عندما لا يتوفر sqlite-vec، يعود OpenClaw تلقائيًا إلى تشابه جيب التمام داخل العملية.

---

## تخزين الفهرس

| Key                   | Type     | Default                               | Description                                 |
| --------------------- | -------- | ------------------------------------- | ------------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | موقع الفهرس (يدعم رمز `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                           | مجزئ FTS5 (`unicode61` أو `trigram`)   |

---

## تكوين خلفية QMD

اضبط `memory.backend = "qmd"` للتفعيل. توجد كل إعدادات QMD تحت `memory.qmd`:

| المفتاح                      | النوع      | الافتراضي  | الوصف                                                                           |
| ------------------------ | --------- | -------- | ------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`    | مسار ملف QMD التنفيذي؛ عيّن مسارًا مطلقًا عندما يختلف `PATH` للخدمة عن الصدفة لديك |
| `searchMode`             | `string`  | `search` | أمر البحث: `search`، `vsearch`، `query`                                          |
| `includeDefaultMemory`   | `boolean` | `true`   | فهرسة `MEMORY.md` + `memory/**/*.md` تلقائيًا                                             |
| `paths[]`                | `array`   | --       | مسارات إضافية: `{ name, path, pattern? }`                                               |
| `sessions.enabled`       | `boolean` | `false`  | فهرسة نصوص الجلسات                                                             |
| `sessions.retentionDays` | `number`  | --       | مدة الاحتفاظ بالنصوص                                                                  |
| `sessions.exportDir`     | `string`  | --       | دليل التصدير                                                                      |

`searchMode: "search"` معجمي/BM25 فقط. لا يشغّل OpenClaw فحوصات جاهزية المتجهات الدلالية أو صيانة تضمينات QMD لهذا الوضع، بما في ذلك أثناء `memory status --deep`؛ يواصل `vsearch` و`query` طلب جاهزية متجهات QMD والتضمينات.

يفضّل OpenClaw أشكال مجموعات QMD الحالية واستعلامات MCP، لكنه يحافظ على عمل إصدارات QMD الأقدم عبر تجربة أعلام أنماط مجموعات متوافقة وأسماء أدوات MCP الأقدم عند الحاجة. عندما يعلن QMD دعمه لعدة مرشحات مجموعات، يتم البحث في المجموعات ذات المصدر نفسه باستخدام عملية QMD واحدة؛ وتحافظ إصدارات QMD الأقدم على مسار التوافق لكل مجموعة. يعني المصدر نفسه أن مجموعات الذاكرة الدائمة تُجمع معًا، بينما تبقى مجموعات نصوص الجلسات مجموعة منفصلة بحيث يظل تنويع المصادر يتضمن كلا المدخلين.

<Note>
تبقى تجاوزات نماذج QMD في جانب QMD، لا في إعدادات OpenClaw. إذا احتجت إلى تجاوز نماذج QMD عموميًا، فعيّن متغيرات البيئة مثل `QMD_EMBED_MODEL` و`QMD_RERANK_MODEL` و`QMD_GENERATE_MODEL` في بيئة تشغيل Gateway.
</Note>

<AccordionGroup>
  <Accordion title="جدول التحديث">
    | المفتاح                       | النوع      | الافتراضي | الوصف                           |
    | ------------------------- | --------- | ------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | فاصل التحديث                      |
    | `update.debounceMs`       | `number`  | `15000` | تأخير تغييرات الملفات                 |
    | `update.onBoot`           | `boolean` | `true`  | التحديث عندما يفتح مدير QMD طويل العمر؛ كما يتحكم في التحديث الاختياري عند بدء التشغيل |
    | `update.startup`          | `string`  | `off`   | تحديث اختياري عند بدء Gateway: `off` أو `idle` أو `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | التأخير قبل تشغيل تحديث `startup: "idle"` |
    | `update.waitForBootSync`  | `boolean` | `false` | حظر فتح المدير إلى أن يكتمل تحديثه الأولي |
    | `update.embedInterval`    | `string`  | --      | إيقاع تضمين منفصل                |
    | `update.commandTimeoutMs` | `number`  | --      | مهلة أوامر QMD              |
    | `update.updateTimeoutMs`  | `number`  | --      | مهلة عمليات تحديث QMD     |
    | `update.embedTimeoutMs`   | `number`  | --      | مهلة عمليات تضمين QMD      |
  </Accordion>
  <Accordion title="الحدود">
    | المفتاح                       | النوع     | الافتراضي | الوصف                |
    | ------------------------- | -------- | ------- | -------------------------- |
    | `limits.maxResults`       | `number` | `6`     | الحد الأقصى لنتائج البحث         |
    | `limits.maxSnippetChars`  | `number` | --      | تقييد طول المقتطف       |
    | `limits.maxInjectedChars` | `number` | --      | تقييد إجمالي الأحرف المحقونة |
    | `limits.timeoutMs`        | `number` | `4000`  | مهلة البحث             |
  </Accordion>
  <Accordion title="النطاق">
    يتحكم في الجلسات التي يمكنها تلقي نتائج بحث QMD. يستخدم المخطط نفسه مثل [`session.sendPolicy`](/ar/gateway/config-agents#session):

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

    يسمح الإعداد الافتراضي المضمن بالجلسات المباشرة وجلسات القنوات، مع الاستمرار في رفض المجموعات.

    الافتراضي هو الرسائل المباشرة فقط. يطابق `match.keyPrefix` مفتاح الجلسة المطبّع؛ ويطابق `match.rawKeyPrefix` المفتاح الخام بما في ذلك `agent:<id>:`.

  </Accordion>
  <Accordion title="الاستشهادات">
    ينطبق `memory.citations` على كل الخلفيات:

    | القيمة            | السلوك                                            |
    | ---------------- | --------------------------------------------------- |
    | `auto` (الافتراضي) | تضمين تذييل `Source: <path#line>` في المقتطفات    |
    | `on`             | تضمين التذييل دائمًا                               |
    | `off`            | حذف التذييل (يبقى المسار ممررًا إلى الوكيل داخليًا) |

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

تُضبط Dreaming ضمن `plugins.entries.memory-core.config.dreaming`، وليس ضمن `agents.defaults.memorySearch`.

تعمل Dreaming كعملية مسح مجدولة واحدة وتستخدم مراحل داخلية خفيفة/عميقة/REM كتفصيل تنفيذي.

للسلوك المفاهيمي وأوامر الشرطة المائلة، راجع [Dreaming](/ar/concepts/dreaming).

### إعدادات المستخدم

| المفتاح         | النوع      | الافتراضي       | الوصف                                       |
| ----------- | --------- | ------------- | ------------------------------------------------- |
| `enabled`   | `boolean` | `false`       | تمكين Dreaming أو تعطيلها بالكامل               |
| `frequency` | `string`  | `0 3 * * *`   | إيقاع Cron اختياري لمسح Dreaming الكامل |
| `model`     | `string`  | النموذج الافتراضي | تجاوز اختياري لنموذج وكيل Dream Diary الفرعي      |

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
- تكتب Dreaming المخرجات السردية المقروءة للبشر إلى `DREAMS.md` (أو `dreams.md` الموجود).
- يستخدم `dreaming.model` بوابة ثقة الوكيل الفرعي الموجودة في Plugin؛ عيّن `plugins.entries.memory-core.subagent.allowModelOverride: true` قبل تمكينه.
- يعيد Dream Diary المحاولة مرة واحدة باستخدام نموذج الجلسة الافتراضي عندما يكون النموذج المضبوط غير متاح. تُسجّل إخفاقات الثقة أو قائمة السماح ولا يُعاد المحاولة بصمت.
- سياسة مراحل الخفيف/العميق/REM والعتبات سلوك داخلي، وليست إعدادات موجهة للمستخدم.

</Note>

## ذات صلة

- [مرجع الإعدادات](/ar/gateway/configuration-reference)
- [نظرة عامة على الذاكرة](/ar/concepts/memory)
- [بحث الذاكرة](/ar/concepts/memory-search)
