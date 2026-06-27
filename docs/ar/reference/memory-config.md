---
read_when:
    - تريد تهيئة موفّري بحث الذاكرة أو نماذج التضمين
    - تريد إعداد الواجهة الخلفية لـ QMD
    - تريد ضبط البحث الهجين أو MMR أو التضاؤل الزمني
    - تريد تمكين فهرسة الذاكرة متعددة الوسائط
sidebarTitle: Memory config
summary: كل إعدادات التهيئة للبحث في الذاكرة، ومزوّدي التضمين، وQMD، والبحث الهجين، والفهرسة متعددة الوسائط
title: مرجع إعدادات الذاكرة
x-i18n:
    generated_at: "2026-06-27T18:30:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d8f5880fef3fbdf81e546b0309a0e53459bae47e16efd787f87e34050d8c7b1e
    source_path: reference/memory-config.md
    workflow: 16
---

تسرد هذه الصفحة كل إعداد تكوين لبحث ذاكرة OpenClaw. للاطلاع على لمحات مفاهيمية، راجع:

<CardGroup cols={2}>
  <Card title="نظرة عامة على الذاكرة" href="/ar/concepts/memory">
    كيف تعمل الذاكرة.
  </Card>
  <Card title="المحرك المضمّن" href="/ar/concepts/memory-builtin">
    واجهة SQLite الخلفية الافتراضية.
  </Card>
  <Card title="محرك QMD" href="/ar/concepts/memory-qmd">
    ملف مرافق يعطي الأولوية للتشغيل المحلي.
  </Card>
  <Card title="بحث الذاكرة" href="/ar/concepts/memory-search">
    مسار البحث والضبط.
  </Card>
  <Card title="Active memory" href="/ar/concepts/active-memory">
    وكيل فرعي للذاكرة للجلسات التفاعلية.
  </Card>
</CardGroup>

توجد كل إعدادات بحث الذاكرة ضمن `agents.defaults.memorySearch` في `openclaw.json` ما لم يُذكر خلاف ذلك.

<Note>
إذا كنت تبحث عن مفتاح تبديل ميزة **active memory** وتكوين الوكيل الفرعي، فهو موجود ضمن `plugins.entries.active-memory` بدلاً من `memorySearch`.

تستخدم active memory نموذج بوابتين:

1. يجب تفعيل Plugin وأن يستهدف معرّف الوكيل الحالي
2. يجب أن يكون الطلب جلسة دردشة تفاعلية مستمرة مؤهلة

راجع [Active Memory](/ar/concepts/active-memory) لمعرفة نموذج التفعيل، والتكوين المملوك من Plugin، واستمرارية النصوص، ونمط الطرح الآمن.
</Note>

---

## اختيار المزوّد

| المفتاح    | النوع     | الافتراضي        | الوصف                                                                                                                                                                                                                                                                                            |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider` | `string`  | `"openai"`       | معرّف محوّل التضمين مثل `bedrock` أو `deepinfra` أو `gemini` أو `github-copilot` أو `local` أو `mistral` أو `ollama` أو `openai` أو `openai-compatible` أو `voyage`؛ ويمكن أيضاً أن يكون `models.providers.<id>` مكوّناً تشير قيمة `api` فيه إلى محوّل تضمين ذاكرة أو واجهة API نموذج متوافقة مع OpenAI |
| `model`    | `string`  | افتراضي المزوّد | اسم نموذج التضمين                                                                                                                                                                                                                                                                                |
| `fallback` | `string`  | `"none"`         | معرّف محوّل الرجوع عند فشل المحوّل الأساسي                                                                                                                                                                                                                                                       |
| `enabled`  | `boolean` | `true`           | تفعيل بحث الذاكرة أو تعطيله                                                                                                                                                                                                                                                                      |

عند عدم تعيين `provider`، يستخدم OpenClaw تضمينات OpenAI. عيّن `provider`
صراحة لاستخدام Gemini أو Voyage أو Mistral أو DeepInfra أو Bedrock أو GitHub Copilot أو
Ollama أو نموذج GGUF محلي أو نقطة نهاية `/v1/embeddings` متوافقة مع OpenAI.
التكوينات القديمة التي لا تزال تقول `provider: "auto"` تُحل إلى `openai`.

<Warning>
يمكن أن يؤدي تغيير مزوّد التضمين أو النموذج أو إعدادات المزوّد أو المصادر أو النطاق
أو التقسيم إلى مقاطع أو المرمّز إلى جعل فهرس متجهات SQLite الحالي غير متوافق.
يوقف OpenClaw بحث المتجهات مؤقتاً ويبلغ عن تحذير هوية الفهرس بدلاً من
إعادة تضمين كل شيء تلقائياً. أعد البناء عندما تكون جاهزاً باستخدام
`openclaw memory status --index --agent <id>` أو
`openclaw memory index --force --agent <id>`.
</Warning>

عندما يكون `provider` غير معيّن، أو تكون القيمة القديمة `provider: "auto"` موجودة، أو
تحدد `provider: "none"` عمداً وضع FTS فقط، يمكن لاستدعاء الذاكرة أن يظل
يستخدم ترتيب FTS المعجمي عندما لا تكون التضمينات متاحة.

تفشل المزوّدات غير المحلية المحددة صراحةً بإغلاق صارم. إذا عيّنت `memorySearch.provider` إلى
مزوّد ملموس مدعوم عن بُعد مثل OpenAI أو Gemini أو Voyage أو Mistral أو
Bedrock أو GitHub Copilot أو DeepInfra أو Ollama أو LM Studio أو مزوّد مخصص
متوافق مع OpenAI، وكان ذلك المزوّد غير متاح في وقت التشغيل، فسيعيد `memory_search`
نتيجة غير متاحة بدلاً من استخدام استدعاء FTS فقط بصمت. أصلح
تكوين المزوّد/المصادقة، أو انتقل إلى مزوّد يمكن الوصول إليه، أو عيّن
`provider: "none"` إذا كنت تريد استدعاء FTS فقط بشكل مقصود.

### معرّفات المزوّدين المخصصة

يمكن أن يشير `memorySearch.provider` إلى إدخال `models.providers.<id>` مخصص لمحوّلات مزوّدين خاصة بالذاكرة مثل `ollama`، أو لواجهات API نماذج متوافقة مع OpenAI مثل `openai-responses` / `openai-completions`. يحل OpenClaw مالك `api` لذلك المزوّد من أجل محوّل التضمين مع الحفاظ على معرّف المزوّد المخصص لمعالجة نقطة النهاية والمصادقة وبادئة النموذج. يتيح ذلك لإعدادات متعددة وحدات GPU أو متعددة المضيفين تخصيص تضمينات الذاكرة لنقطة نهاية محلية محددة:

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

تتطلب التضمينات البعيدة مفتاح API. يستخدم Bedrock سلسلة بيانات الاعتماد الافتراضية في AWS SDK بدلاً من ذلك (أدوار المثيلات، وSSO، ومفاتيح الوصول).

| المزوّد        | متغير البيئة                                      | مفتاح التكوين                       |
| -------------- | -------------------------------------------------- | ----------------------------------- |
| Bedrock        | سلسلة بيانات اعتماد AWS                           | لا حاجة إلى مفتاح API               |
| DeepInfra      | `DEEPINFRA_API_KEY`                                | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | ملف تعريف المصادقة عبر تسجيل دخول الجهاز |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (عنصر نائب)                      | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`    |

<Note>
يغطي Codex OAuth الدردشة/الإكمالات فقط ولا يفي بطلبات التضمين.
</Note>

---

## تكوين نقطة النهاية البعيدة

استخدم `provider: "openai-compatible"` لخادم `/v1/embeddings` عام
متوافق مع OpenAI يجب ألا يرث بيانات اعتماد دردشة OpenAI العامة.

<ParamField path="remote.baseUrl" type="string">
  عنوان URL الأساسي المخصص للـ API.
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

## تكوين خاص بالمزوّد

<AccordionGroup>
  <Accordion title="Gemini">
    | المفتاح                | النوع    | الافتراضي             | الوصف                                      |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | يدعم أيضاً `gemini-embedding-2-preview`    |
    | `outputDimensionality` | `number` | `3072`                 | لـ Embedding 2: 768 أو 1536 أو 3072        |

    <Warning>
    يؤدي تغيير النموذج أو `outputDimensionality` إلى تغيير هوية الفهرس. يوقف OpenClaw
    بحث المتجهات مؤقتاً حتى تعيد بناء فهرس الذاكرة صراحةً.
    </Warning>

  </Accordion>
  <Accordion title="أنواع إدخال متوافقة مع OpenAI">
    يمكن لنقاط نهاية التضمين المتوافقة مع OpenAI أن تختار استخدام حقول طلب `input_type` الخاصة بالمزوّد. يفيد ذلك لنماذج التضمين غير المتماثلة التي تتطلب تسميات مختلفة لتضمينات الاستعلام والمستندات.

    | المفتاح            | النوع    | الافتراضي | الوصف                                             |
    | ------------------- | -------- | ------- | ------------------------------------------------------- |
    | `inputType`         | `string` | غير معيّن | `input_type` مشترك لتضمينات الاستعلام والمستندات   |
    | `queryInputType`    | `string` | غير معيّن | `input_type` وقت الاستعلام؛ يتجاوز `inputType`          |
    | `documentInputType` | `string` | غير معيّن | `input_type` للفهرس/المستند؛ يتجاوز `inputType`      |

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

    يؤثر تغيير هذه القيم على هوية ذاكرة التخزين المؤقت للتضمين لفهرسة دفعات المزوّد، ويجب أن يتبعه إعادة فهرسة للذاكرة عندما يتعامل النموذج المصدر مع التسميات بشكل مختلف.

  </Accordion>
  <Accordion title="Bedrock">
    ### تكوين تضمين Bedrock

    يستخدم Bedrock سلسلة بيانات الاعتماد الافتراضية في AWS SDK، ولا حاجة إلى مفاتيح API. إذا كان OpenClaw يعمل على EC2 بدور مثيل مفعّل لـ Bedrock، فما عليك سوى تعيين المزوّد والنموذج:

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

    | المفتاح                | النوع    | الافتراضي                     | الوصف                         |
    | ---------------------- | -------- | ------------------------------ | ------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | أي معرّف نموذج تضمين من Bedrock |
    | `outputDimensionality` | `number` | افتراضي النموذج                | لـ Titan V2: 256 أو 512 أو 1024 |

    **النماذج المدعومة** (مع اكتشاف العائلة وافتراضيات الأبعاد):

    | معرّف النموذج                                   | المزوّد   | الأبعاد الافتراضية | الأبعاد القابلة للتكوين    |
    | ------------------------------------------ | ---------- | ------------ | -------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024         | 256, 512, 1024       |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536         | --                   |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536         | --                   |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024         | --                   |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024         | 256, 384, 1024, 3072 |
    | `cohere.embed-english-v3`                  | Cohere     | 1024         | --                   |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024         | --                   |
    | `cohere.embed-v4:0`                        | Cohere     | 1536         | 256-1536             |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512          | --                   |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024         | --                   |

    ترث المتغيرات ذات لاحقة الإنتاجية (مثل `amazon.titan-embed-text-v1:2:8k`) إعدادات النموذج الأساسي.

    **المصادقة:** تستخدم مصادقة Bedrock ترتيب حل بيانات اعتماد AWS SDK القياسي:

    1. متغيرات البيئة (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. ذاكرة التخزين المؤقت لرموز SSO
    3. بيانات اعتماد رمز هوية الويب
    4. ملفات بيانات الاعتماد والإعدادات المشتركة
    5. بيانات اعتماد بيانات تعريف ECS أو EC2

    يتم حل المنطقة من `AWS_REGION` أو `AWS_DEFAULT_REGION` أو `baseUrl` لمزوّد `amazon-bedrock`، أو تستخدم القيمة الافتراضية `us-east-1`.

    **أذونات IAM:** يحتاج دور IAM أو المستخدم إلى:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    لأقل امتيازات، اجعل نطاق `InvokeModel` مقتصرًا على النموذج المحدد:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Local (GGUF + llama.cpp)">
    | المفتاح                   | النوع               | الافتراضي                | الوصف                                                                                                                                                                                                                                                                                                          |
    | --------------------- | ------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | يتم تنزيله تلقائيًا        | المسار إلى ملف نموذج GGUF                                                                                                                                                                                                                                                                                              |
    | `local.modelCacheDir` | `string`           | افتراضي node-llama-cpp | دليل التخزين المؤقت للنماذج المنزّلة                                                                                                                                                                                                                                                                                      |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | حجم نافذة السياق لسياق التضمين. يغطي 4096 المقاطع النموذجية (128-512 رمزًا) مع ضبط ذاكرة VRAM غير الخاصة بالأوزان. خفّضه إلى 1024-2048 على المضيفات محدودة الموارد. يستخدم `"auto"` الحد الأقصى الذي تدرّب عليه النموذج، ولا يوصى به لنماذج 8B+ (Qwen3-Embedding-8B: 40 960 رمزًا → نحو 32 غيغابايت VRAM مقابل نحو 8.8 غيغابايت عند 4096). |

    ثبّت مزوّد llama.cpp الرسمي أولًا: `openclaw plugins install @openclaw/llama-cpp-provider`.
    النموذج الافتراضي: `embeddinggemma-300m-qat-Q8_0.gguf` (نحو 0.6 غيغابايت، يتم تنزيله تلقائيًا). لا تزال عمليات سحب المصدر تتطلب الموافقة على البناء الأصلي: `pnpm approve-builds` ثم `pnpm rebuild node-llama-cpp`.

    استخدم CLI المستقل للتحقق من مسار المزوّد نفسه الذي يستخدمه Gateway:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    عيّن `provider: "local"` صراحةً لتضمينات GGUF المحلية. مراجع نماذج `hf:` وHTTP(S) مدعومة لإعدادات محلية صريحة، لكنها لا تغيّر المزوّد الافتراضي.

  </Accordion>
</AccordionGroup>

### مهلة التضمين المضمّن

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  تجاوز مهلة دفعات التضمين المضمّنة أثناء فهرسة الذاكرة.

عند عدم الضبط، يُستخدم الافتراضي الخاص بالمزوّد: 600 ثانية للمزوّدين المحليين/المستضافين ذاتيًا مثل `local` و`ollama` و`lmstudio`، و120 ثانية للمزوّدين المستضافين. زد هذه القيمة عندما تكون دفعات التضمين المحلية المقيّدة بوحدة CPU سليمة لكنها بطيئة.
</ParamField>

---

## إعداد البحث الهجين

كلها ضمن `memorySearch.query.hybrid`:

| المفتاح                   | النوع      | الافتراضي | الوصف                        |
| --------------------- | --------- | ------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`  | تفعيل بحث BM25 + المتجهات الهجين |
| `vectorWeight`        | `number`  | `0.7`   | وزن درجات المتجهات (0-1)     |
| `textWeight`          | `number`  | `0.3`   | وزن درجات BM25 (0-1)       |
| `candidateMultiplier` | `number`  | `4`     | مضاعف حجم مجموعة المرشحين     |

<Tabs>
  <Tab title="MMR (diversity)">
    | المفتاح           | النوع      | الافتراضي | الوصف                          |
    | ------------- | --------- | ------- | ------------------------------------ |
    | `mmr.enabled` | `boolean` | `false` | تفعيل إعادة الترتيب باستخدام MMR                |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = أقصى تنوع، 1 = أقصى صلة |
  </Tab>
  <Tab title="Temporal decay (recency)">
    | المفتاح                          | النوع      | الافتراضي | الوصف               |
    | ---------------------------- | --------- | ------- | ------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | تفعيل تعزيز الحداثة      |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | تنخفض الدرجة إلى النصف كل N يومًا |

    لا تُطبّق أي إضعافات زمنية على الملفات دائمة الصلاحية (`MEMORY.md` والملفات غير المؤرخة في `memory/`).

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

| المفتاح      | النوع      | الوصف                                  |
| ------------ | ---------- | -------------------------------------- |
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

يمكن أن تكون المسارات مطلقة أو نسبية إلى مساحة العمل. تُفحص الأدلة بشكل تكراري بحثًا عن ملفات `.md`. تعتمد معالجة الروابط الرمزية على الواجهة الخلفية النشطة: يتجاهل المحرك المدمج الروابط الرمزية، بينما يتبع QMD سلوك ماسح QMD الأساسي.

للبحث في نصوص الوكلاء المتقاطعة ضمن نطاق الوكيل، استخدم `agents.list[].memorySearch.qmd.extraCollections` بدلًا من `memory.qmd.paths`. تتبع تلك المجموعات الإضافية نفس شكل `{ path, name, pattern? }`، لكنها تُدمج لكل وكيل ويمكنها الحفاظ على الأسماء المشتركة الصريحة عندما يشير المسار إلى خارج مساحة العمل الحالية. إذا ظهر المسار نفسه بعد حله في كل من `memory.qmd.paths` و`memorySearch.qmd.extraCollections`، يحتفظ QMD بالإدخال الأول ويتجاوز التكرار.

---

## الذاكرة متعددة الوسائط (Gemini)

افهرس الصور والصوت إلى جانب Markdown باستخدام Gemini Embedding 2:

| المفتاح                  | النوع      | الافتراضي | الوصف                                  |
| ------------------------ | ---------- | --------- | -------------------------------------- |
| `multimodal.enabled`     | `boolean`  | `false`   | تفعيل الفهرسة متعددة الوسائط           |
| `multimodal.modalities`  | `string[]` | --        | `["image"]` أو `["audio"]` أو `["all"]` |
| `multimodal.maxFileBytes` | `number`  | `10000000` | الحد الأقصى لحجم الملف للفهرسة         |

<Note>
ينطبق فقط على الملفات في `extraPaths`. تبقى جذور الذاكرة الافتراضية مقتصرة على Markdown. يتطلب `gemini-embedding-2-preview`. يجب أن تكون `fallback` مساوية لـ `"none"`.
</Note>

الصيغ المدعومة: `.jpg` و`.jpeg` و`.png` و`.webp` و`.gif` و`.heic` و`.heif` (صور)؛ `.mp3` و`.wav` و`.ogg` و`.opus` و`.m4a` و`.aac` و`.flac` (صوت).

---

## ذاكرة التخزين المؤقت للتضمينات

| المفتاح           | النوع     | الافتراضي | الوصف                                  |
| ----------------- | --------- | --------- | -------------------------------------- |
| `cache.enabled`   | `boolean` | `true`    | تخزين تضمينات المقاطع مؤقتًا في SQLite |
| `cache.maxEntries` | `number` | `50000`   | الحد الأقصى للتضمينات المخزنة مؤقتًا   |

يمنع إعادة تضمين النص غير المتغير أثناء إعادة الفهرسة أو تحديثات النصوص.

---

## الفهرسة الدُفعية

| المفتاح                      | النوع     | الافتراضي | الوصف                    |
| ---------------------------- | --------- | --------- | ------------------------ |
| `remote.nonBatchConcurrency` | `number`  | `4`       | تضمينات مضمنة متوازية    |
| `remote.batch.enabled`       | `boolean` | `false`   | تفعيل API التضمين الدُفعي |
| `remote.batch.concurrency`   | `number`  | `2`       | مهام دُفعية متوازية       |
| `remote.batch.wait`          | `boolean` | `true`    | الانتظار لاكتمال الدُفعة  |
| `remote.batch.pollIntervalMs` | `number` | --        | فاصل الاستطلاع            |
| `remote.batch.timeoutMinutes` | `number` | --        | مهلة الدُفعة              |

متاحة لـ `openai` و`gemini` و`voyage`. تكون دُفعات OpenAI عادةً الأسرع والأرخص لعمليات الملء الخلفي الكبيرة.

يتحكم `remote.nonBatchConcurrency` في استدعاءات التضمين المضمنة التي يستخدمها المزوّدون المحليون/ذوو الاستضافة الذاتية والمزوّدون المستضافون عندما لا تكون واجهات API الدُفعية للمزوّد نشطة. القيمة الافتراضية لـ Ollama هي `1` للفهرسة غير الدُفعية لتجنب إرهاق المضيفين المحليين الأصغر؛ اضبط قيمة أعلى على الأجهزة الأكبر.

هذا منفصل عن `sync.embeddingBatchTimeoutSeconds`، الذي يتحكم في مهلة استدعاءات التضمين المضمنة.

---

## بحث ذاكرة الجلسة (تجريبي)

افهرس نصوص الجلسات واعرضها عبر `memory_search`:

| المفتاح                      | النوع      | الافتراضي   | الوصف                              |
| ---------------------------- | ---------- | ----------- | ---------------------------------- |
| `experimental.sessionMemory` | `boolean`  | `false`     | تفعيل فهرسة الجلسات                |
| `sources`                    | `string[]` | `["memory"]` | أضف `"sessions"` لتضمين النصوص     |
| `sync.sessions.deltaBytes`   | `number`   | `100000`    | حد البايتات لإعادة الفهرسة         |
| `sync.sessions.deltaMessages` | `number`  | `50`        | حد الرسائل لإعادة الفهرسة          |

<Warning>
فهرسة الجلسات اختيارية وتعمل بشكل غير متزامن. قد تكون النتائج قديمة قليلًا. تعيش سجلات الجلسات على القرص، لذا تعامل مع الوصول إلى نظام الملفات باعتباره حد الثقة.
</Warning>

---

## تسريع متجهات SQLite (sqlite-vec)

| المفتاح                     | النوع     | الافتراضي | الوصف                              |
| ---------------------------- | --------- | ------- | --------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | استخدم sqlite-vec لاستعلامات المتجهات |
| `store.vector.extensionPath` | `string`  | مضمّن | تجاوز مسار sqlite-vec          |

عندما لا يكون sqlite-vec متاحًا، يعود OpenClaw تلقائيًا إلى تشابه جيب التمام داخل العملية.

---

## تخزين الفهارس

توجد فهارس الذاكرة المضمّنة في قاعدة بيانات OpenClaw SQLite لكل وكيل في
`agents/<agentId>/agent/openclaw-agent.sqlite`.

| المفتاح              | النوع    | الافتراضي | الوصف                               |
| --------------------- | -------- | ----------- | ----------------------------------------- |
| `store.fts.tokenizer` | `string` | `unicode61` | مجزّئ FTS5 (`unicode61` أو `trigram`) |

---

## تهيئة خلفية QMD

اضبط `memory.backend = "qmd"` للتفعيل. توجد جميع إعدادات QMD ضمن `memory.qmd`:

| المفتاح                 | النوع     | الافتراضي | الوصف                                                                           |
| ------------------------ | --------- | -------- | ------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`    | مسار ملف QMD التنفيذي؛ اضبط مسارًا مطلقًا عندما يختلف `PATH` الخاص بالخدمة عن صدفتك |
| `searchMode`             | `string`  | `search` | أمر البحث: `search`، `vsearch`، `query`                                          |
| `rerank`                 | `boolean` | --       | اضبطه على `false` مع `searchMode: "query"` وQMD 2.1+ لتخطي إعادة الترتيب في QMD          |
| `includeDefaultMemory`   | `boolean` | `true`   | فهرسة تلقائية لـ `MEMORY.md` + `memory/**/*.md`                                             |
| `paths[]`                | `array`   | --       | مسارات إضافية: `{ name, path, pattern? }`                                               |
| `sessions.enabled`       | `boolean` | `false`  | فهرسة نصوص الجلسات                                                             |
| `sessions.retentionDays` | `number`  | --       | مدة الاحتفاظ بالنصوص                                                                  |
| `sessions.exportDir`     | `string`  | --       | دليل التصدير                                                                      |

`searchMode: "search"` معجمي/BM25 فقط. لا يشغّل OpenClaw فحوص جاهزية المتجهات الدلالية أو صيانة تضمينات QMD لهذا الوضع، بما في ذلك أثناء `memory status --deep`؛ يواصل `vsearch` و`query` طلب جاهزية متجهات QMD والتضمينات.

`rerank: false` يغيّر وضع `query` في QMD فقط ويتطلب QMD 2.1 أو أحدث. في وضع CLI المباشر يمرر OpenClaw الخيار `--no-rerank`؛ وفي وضع MCP المدعوم بـ mcporter يمرر `rerank: false` إلى أداة الاستعلام الموحدة في QMD. اتركه غير مضبوط لاستخدام سلوك إعادة ترتيب الاستعلام الافتراضي في QMD.

يفضّل OpenClaw أشكال مجموعة QMD واستعلام MCP الحالية، لكنه يُبقي إصدارات QMD الأقدم عاملة عبر تجربة أعلام أنماط مجموعات متوافقة وأسماء أدوات MCP الأقدم عند الحاجة. عندما يعلن QMD دعمه لعدة مرشحات مجموعات، تُبحث المجموعات ذات المصدر نفسه بعملية QMD واحدة؛ وتحافظ إصدارات QMD الأقدم على مسار التوافق لكل مجموعة. يعني المصدر نفسه أن مجموعات الذاكرة الدائمة تُجمّع معًا، بينما تبقى مجموعات نصوص الجلسات في مجموعة منفصلة لكي يظل تنويع المصادر يحتوي على كلا الإدخالين.

<Note>
تبقى تجاوزات نموذج QMD في جانب QMD، وليس في تهيئة OpenClaw. إذا احتجت إلى تجاوز نماذج QMD عالميًا، فاضبط متغيرات البيئة مثل `QMD_EMBED_MODEL` و`QMD_RERANK_MODEL` و`QMD_GENERATE_MODEL` في بيئة تشغيل Gateway.
</Note>

<AccordionGroup>
  <Accordion title="جدول التحديث">
    | المفتاح                  | النوع     | الافتراضي | الوصف                           |
    | ------------------------- | --------- | ------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | فاصل التحديث                      |
    | `update.debounceMs`       | `number`  | `15000` | تأجيل تغييرات الملفات                 |
    | `update.onBoot`           | `boolean` | `true`  | التحديث عند فتح مدير QMD طويل العمر؛ اضبطه على false لتخطي تحديث الإقلاع الفوري |
    | `update.startup`          | `string`  | `off`   | تهيئة QMD اختيارية عند بدء Gateway: `off` أو `idle` أو `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | التأخير قبل تشغيل تحديث `startup: "idle"` |
    | `update.waitForBootSync`  | `boolean` | `false` | حظر فتح المدير حتى يكتمل تحديثه الأولي |
    | `update.embedInterval`    | `string`  | --      | وتيرة تضمين منفصلة                |
    | `update.commandTimeoutMs` | `number`  | --      | مهلة أوامر QMD              |
    | `update.updateTimeoutMs`  | `number`  | --      | مهلة عمليات تحديث QMD     |
    | `update.embedTimeoutMs`   | `number`  | --      | مهلة عمليات تضمين QMD      |
  </Accordion>
  <Accordion title="الحدود">
    | المفتاح                  | النوع    | الافتراضي | الوصف                |
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

    يسمح الافتراضي المشحون بالجلسات المباشرة وجلسات القنوات، مع الاستمرار في رفض المجموعات.

    الافتراضي هو الرسائل المباشرة فقط. يطابق `match.keyPrefix` مفتاح الجلسة المطبّع؛ ويطابق `match.rawKeyPrefix` المفتاح الخام بما في ذلك `agent:<id>:`.

  </Accordion>
  <Accordion title="الاستشهادات">
    ينطبق `memory.citations` على جميع الخلفيات:

    | القيمة             | السلوك                                            |
    | ---------------- | --------------------------------------------------- |
    | `auto` (الافتراضي) | تضمين تذييل `Source: <path#line>` في المقتطفات    |
    | `on`             | تضمين التذييل دائمًا                               |
    | `off`            | حذف التذييل (لا يزال المسار يُمرر إلى الوكيل داخليًا) |

  </Accordion>
</AccordionGroup>

عند تفعيل تهيئة QMD عند بدء Gateway، يبدأ OpenClaw تشغيل QMD للوكلاء المؤهلين فقط. إذا كان `update.onBoot` صحيحًا ولم تُهيأ صيانة الفاصل/التضمين، يستخدم بدء التشغيل مديرًا لمرة واحدة لتحديث الإقلاع ثم يغلقه. إذا هُيئ فاصل تحديث أو تضمين، يفتح بدء التشغيل مدير QMD طويل العمر لكي يمتلك المراقب ومؤقتات الفواصل؛ يتخطى `update.onBoot: false` تحديث الإقلاع الفوري فقط.

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

تُهيأ Dreaming ضمن `plugins.entries.memory-core.config.dreaming`، وليس ضمن `agents.defaults.memorySearch`.

تعمل Dreaming كعملية مسح مجدولة واحدة وتستخدم مراحل داخلية خفيفة/عميقة/REM كتفصيل تنفيذي.

للسلوك المفاهيمي وأوامر الشرطة المائلة، راجع [Dreaming](/ar/concepts/dreaming).

### إعدادات المستخدم

| المفتاح                               | النوع     | الافتراضي       | الوصف                                                                                                                      |
| -------------------------------------- | --------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`       | تفعيل Dreaming أو تعطيلها بالكامل                                                                                              |
| `frequency`                            | `string`  | `0 3 * * *`   | وتيرة Cron اختيارية لمسح Dreaming الكامل                                                                                |
| `model`                                | `string`  | النموذج الافتراضي | تجاوز اختياري لنموذج الوكيل الفرعي Dream Diary                                                                                     |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`         | الحد الأقصى للتوكنات المقدّرة المحتفظ بها من كل مقتطف استدعاء قصير المدى يُرقّى إلى `MEMORY.md`؛ تبقى بيانات المصدر الوصفية مرئية |

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
- تكتب Dreaming المخرجات السردية القابلة للقراءة إلى `DREAMS.md` (أو `dreams.md` الموجود).
- يستخدم `dreaming.model` بوابة الثقة الحالية للوكيل الفرعي في Plugin؛ اضبط `plugins.entries.memory-core.subagent.allowModelOverride: true` قبل تفعيله.
- يعيد Dream Diary المحاولة مرة واحدة باستخدام النموذج الافتراضي للجلسة عندما يكون النموذج المهيأ غير متاح. تُسجّل إخفاقات الثقة أو قائمة السماح ولا تُعاد المحاولة بصمت.
- سياسة وعتبات مراحل الخفيفة/العميقة/REM هي سلوك داخلي، وليست تهيئة موجهة للمستخدم.

</Note>

## ذات صلة

- [مرجع التهيئة](/ar/gateway/configuration-reference)
- [نظرة عامة على الذاكرة](/ar/concepts/memory)
- [بحث الذاكرة](/ar/concepts/memory-search)
