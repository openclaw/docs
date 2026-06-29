---
read_when:
    - تريد تكوين موفّري البحث في الذاكرة أو نماذج التضمين
    - تريد إعداد خلفية QMD
    - تريد ضبط البحث الهجين أو MMR أو الاضمحلال الزمني
    - تريد تمكين فهرسة الذاكرة متعددة الوسائط
sidebarTitle: Memory config
summary: جميع عناصر ضبط التكوين للبحث في الذاكرة، ومزوّدي التضمين، وQMD، والبحث الهجين، والفهرسة متعددة الوسائط
title: مرجع إعدادات الذاكرة
x-i18n:
    generated_at: "2026-06-28T22:33:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de7d1c23cd415293001ef59ae2572cd7bfe9a88c70c1e4cf138ee60664ff0ac2
    source_path: reference/memory-config.md
    workflow: 16
---

تسرد هذه الصفحة كل خيار تهيئة لبحث الذاكرة في OpenClaw. للاطلاع على النظرات العامة المفاهيمية، راجع:

<CardGroup cols={2}>
  <Card title="Memory overview" href="/ar/concepts/memory">
    كيف تعمل الذاكرة.
  </Card>
  <Card title="Builtin engine" href="/ar/concepts/memory-builtin">
    واجهة SQLite الخلفية الافتراضية.
  </Card>
  <Card title="QMD engine" href="/ar/concepts/memory-qmd">
    ملحق جانبي يعطي الأولوية للمحلي.
  </Card>
  <Card title="Memory search" href="/ar/concepts/memory-search">
    مسار البحث وضبطه.
  </Card>
  <Card title="Active memory" href="/ar/concepts/active-memory">
    وكيل فرعي للذاكرة للجلسات التفاعلية.
  </Card>
</CardGroup>

توجد كل إعدادات بحث الذاكرة ضمن `agents.defaults.memorySearch` في `openclaw.json` ما لم يُذكر خلاف ذلك.

<Note>
إذا كنت تبحث عن مفتاح تفعيل ميزة **الذاكرة النشطة** وتهيئة الوكيل الفرعي، فهذا موجود ضمن `plugins.entries.active-memory` بدلا من `memorySearch`.

تستخدم الذاكرة النشطة نموذجا ببوابتين:

1. يجب أن يكون Plugin مفعلا وأن يستهدف معرّف الوكيل الحالي
2. يجب أن يكون الطلب جلسة دردشة تفاعلية مستمرة مؤهلة

راجع [Active Memory](/ar/concepts/active-memory) للاطلاع على نموذج التفعيل، والتهيئة التي يملكها Plugin، واستمرار نص الجلسة، ونمط الطرح الآمن.
</Note>

---

## اختيار المزوّد

| المفتاح        | النوع      | الافتراضي          | الوصف                                                                                                                                                                                                                                                                                 |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | `"openai"`       | معرّف محوّل التضمين مثل `bedrock` أو `deepinfra` أو `gemini` أو `github-copilot` أو `local` أو `mistral` أو `ollama` أو `openai` أو `openai-compatible` أو `voyage`؛ ويمكن أيضا أن يكون `models.providers.<id>` مهيأ يشير `api` الخاص به إلى محوّل تضمين ذاكرة أو واجهة API لنموذج متوافق مع OpenAI |
| `model`    | `string`  | افتراضي المزوّد | اسم نموذج التضمين                                                                                                                                                                                                                                                                        |
| `fallback` | `string`  | `"none"`         | معرّف محوّل الاحتياط عند فشل الأساسي                                                                                                                                                                                                                                                  |
| `enabled`  | `boolean` | `true`           | تفعيل بحث الذاكرة أو تعطيله                                                                                                                                                                                                                                                             |

عندما لا يكون `provider` معيّنا، يستخدم OpenClaw تضمينات OpenAI. عيّن `provider`
صراحة لاستخدام Gemini أو Voyage أو Mistral أو DeepInfra أو Bedrock أو GitHub Copilot،
أو Ollama، أو نموذج GGUF محلي، أو نقطة نهاية `/v1/embeddings` متوافقة مع OpenAI.
التهيئات القديمة التي ما زالت تقول `provider: "auto"` تُحل إلى `openai`.

<Warning>
قد يؤدي تغيير مزوّد التضمين أو النموذج أو إعدادات المزوّد أو المصادر أو النطاق
أو التقسيم إلى مقاطع أو المرمّز إلى جعل فهرس متجهات SQLite الحالي غير متوافق.
يوقف OpenClaw بحث المتجهات مؤقتا ويبلغ عن تحذير هوية الفهرس بدلا من
إعادة تضمين كل شيء تلقائيا. أعد البناء عندما تكون جاهزا باستخدام
`openclaw memory status --index --agent <id>` أو
`openclaw memory index --force --agent <id>`.
</Warning>

عندما يكون `provider` غير معيّن، أو تكون `provider: "auto"` القديمة موجودة، أو
تحدد `provider: "none"` عمدا وضع FTS فقط، يمكن لاسترجاع الذاكرة أن يظل
يستخدم ترتيب FTS المعجمي عندما لا تتوفر التضمينات.

تفشل المزوّدات غير المحلية الصريحة بإغلاق المسار. إذا عيّنت `memorySearch.provider` إلى
مزوّد محدد مدعوم عن بُعد مثل OpenAI أو Gemini أو Voyage أو Mistral أو
Bedrock أو GitHub Copilot أو DeepInfra أو Ollama أو LM Studio أو مزوّد مخصص
متوافق مع OpenAI، ولم يكن ذلك المزوّد متاحا وقت التشغيل، فإن `memory_search`
يعيد نتيجة غير متاحة بدلا من استخدام استرجاع FTS فقط بصمت. أصلح
تهيئة المزوّد/المصادقة، أو انتقل إلى مزوّد يمكن الوصول إليه، أو عيّن
`provider: "none"` إذا كنت تريد استرجاع FTS فقط عمدا.

### معرّفات المزوّدات المخصصة

يمكن أن يشير `memorySearch.provider` إلى إدخال `models.providers.<id>` مخصص لمحوّلات المزوّد الخاصة بالذاكرة مثل `ollama`، أو لواجهات API لنماذج متوافقة مع OpenAI مثل `openai-responses` / `openai-completions`. يحل OpenClaw مالك `api` لذلك المزوّد لمحوّل التضمين مع الحفاظ على معرّف المزوّد المخصص لمعالجة نقطة النهاية والمصادقة وبادئة النموذج. يتيح هذا لإعدادات متعددة GPU أو متعددة المضيفين تخصيص تضمينات الذاكرة لنقطة نهاية محلية محددة:

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

تتطلب التضمينات البعيدة مفتاح API. يستخدم Bedrock سلسلة بيانات اعتماد AWS SDK الافتراضية بدلا من ذلك (أدوار المثيلات، وSSO، ومفاتيح الوصول).

| المزوّد       | متغير البيئة                                            | مفتاح التهيئة                          |
| -------------- | -------------------------------------------------- | ----------------------------------- |
| Bedrock        | سلسلة بيانات اعتماد AWS                               | لا حاجة إلى مفتاح API                   |
| DeepInfra      | `DEEPINFRA_API_KEY`                                | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | ملف المصادقة عبر تسجيل دخول الجهاز       |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (عنصر نائب)                     | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`    |

<Note>
يغطي Codex OAuth الدردشة/الإكمالات فقط ولا يفي بطلبات التضمين.
</Note>

---

## تهيئة نقطة النهاية البعيدة

استخدم `provider: "openai-compatible"` لخادم `/v1/embeddings` عام متوافق مع OpenAI
لا ينبغي أن يرث بيانات اعتماد دردشة OpenAI العامة.

<ParamField path="remote.baseUrl" type="string">
  عنوان URL الأساسي المخصص لواجهة API.
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

## التهيئة الخاصة بالمزوّد

<AccordionGroup>
  <Accordion title="Gemini">
    | المفتاح                    | النوع     | الافتراضي                | الوصف                                |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | يدعم أيضا `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                 | لـ Embedding 2: 768 أو 1536 أو 3072        |

    <Warning>
    يؤدي تغيير النموذج أو `outputDimensionality` إلى تغيير هوية الفهرس. يوقف OpenClaw
    بحث المتجهات مؤقتا حتى تعيد بناء فهرس الذاكرة صراحة.
    </Warning>

  </Accordion>
  <Accordion title="OpenAI-compatible input types">
    يمكن لنقاط نهاية التضمين المتوافقة مع OpenAI الاشتراك في حقول طلب `input_type` الخاصة بالمزوّد. يكون هذا مفيدا لنماذج التضمين غير المتناظرة التي تتطلب تسميات مختلفة لتضمينات الاستعلام والمستند.

    | المفتاح                 | النوع     | الافتراضي | الوصف                                             |
    | ------------------- | -------- | ------- | ------------------------------------------------------- |
    | `inputType`         | `string` | غير معيّن   | `input_type` مشترك لتضمينات الاستعلام والمستند   |
    | `queryInputType`    | `string` | غير معيّن   | `input_type` وقت الاستعلام؛ يتجاوز `inputType`          |
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

    يؤثر تغيير هذه القيم في هوية ذاكرة التخزين المؤقت للتضمين لفهرسة دفعات المزوّد، وينبغي أن يتبعه إعادة فهرسة للذاكرة عندما يتعامل النموذج upstream مع التسميات بشكل مختلف.

  </Accordion>
  <Accordion title="Bedrock">
    ### تهيئة تضمين Bedrock

    يستخدم Bedrock سلسلة بيانات اعتماد AWS SDK الافتراضية — لا حاجة إلى مفاتيح API. إذا كان OpenClaw يعمل على EC2 بدور مثيل مفعّل لـ Bedrock، فعيّن المزوّد والنموذج فقط:

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

    | المفتاح                    | النوع     | الافتراضي                        | الوصف                     |
    | ---------------------- | -------- | ------------------------------ | ------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | أي معرّف نموذج تضمين في Bedrock  |
    | `outputDimensionality` | `number` | افتراضي النموذج                  | لـ Titan V2: 256 أو 512 أو 1024 |

    **النماذج المدعومة** (مع اكتشاف العائلة وافتراضيات الأبعاد):

    | معرّف النموذج                            | المزوّد    | الأبعاد الافتراضية | الأبعاد القابلة للضبط |
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

    ترث المتغيرات ذات لاحقة معدل الإنتاجية (مثل `amazon.titan-embed-text-v1:2:8k`) إعدادات النموذج الأساسي.

    **المصادقة:** تستخدم مصادقة Bedrock ترتيب حل بيانات الاعتماد القياسي في AWS SDK:

    1. متغيرات البيئة (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. ذاكرة التخزين المؤقت لرموز SSO
    3. بيانات اعتماد رمز هوية الويب
    4. ملفات بيانات الاعتماد والإعدادات المشتركة
    5. بيانات اعتماد بيانات تعريف ECS أو EC2

    تُحل المنطقة من `AWS_REGION`، أو `AWS_DEFAULT_REGION`، أو `baseUrl` لمزوّد `amazon-bedrock`، أو تكون افتراضيًا `us-east-1`.

    **أذونات IAM:** يحتاج دور IAM أو المستخدم إلى:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    لتطبيق مبدأ أقل امتياز، احصر `InvokeModel` في النموذج المحدد:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Local (GGUF + llama.cpp)">
    | المفتاح              | النوع              | الافتراضي             | الوصف                                                                                                                                                                                                                                                                                                          |
    | --------------------- | ------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | يُنزّل تلقائيًا        | المسار إلى ملف نموذج GGUF                                                                                                                                                                                                                                                                                              |
    | `local.modelCacheDir` | `string`           | افتراضي node-llama-cpp | مجلد ذاكرة التخزين المؤقت للنماذج التي تم تنزيلها                                                                                                                                                                                                                                                                                      |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | حجم نافذة السياق لسياق التضمين. يغطي 4096 المقاطع المعتادة (128–512 رمزًا) مع تقييد VRAM غير المخصصة للأوزان. خفّضه إلى 1024–2048 على المضيفين محدودي الموارد. يستخدم `"auto"` الحد الأقصى الذي دُرّب عليه النموذج — ولا يوصى به لنماذج 8B+ (Qwen3-Embedding-8B: 40 960 رمزًا → نحو 32 GB من VRAM مقابل نحو 8.8 GB عند 4096). |

    ثبّت مزوّد llama.cpp الرسمي أولًا: `openclaw plugins install @openclaw/llama-cpp-provider`.
    النموذج الافتراضي: `embeddinggemma-300m-qat-Q8_0.gguf` (نحو 0.6 GB، يُنزّل تلقائيًا). ما زالت نسخ المصدر المحلية تتطلب الموافقة على البناء الأصلي: `pnpm approve-builds` ثم `pnpm rebuild node-llama-cpp`.

    استخدم CLI المستقل للتحقق من مسار المزوّد نفسه الذي يستخدمه Gateway:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    عيّن `provider: "local"` صراحةً لتضمينات GGUF المحلية. مراجع نماذج `hf:` وHTTP(S) مدعومة للإعدادات المحلية الصريحة، لكنها لا تغيّر المزوّد الافتراضي.

  </Accordion>
</AccordionGroup>

### مهلة التضمين المضمّن

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  تجاوز المهلة لدُفعات التضمين المضمّنة أثناء فهرسة الذاكرة.

عند عدم التعيين، يُستخدم افتراضي المزوّد: 600 ثانية للمزوّدين المحليين/المستضافين ذاتيًا مثل `local` و`ollama` و`lmstudio`، و120 ثانية للمزوّدين المستضافين. زد هذه القيمة عندما تكون دُفعات التضمين المحلية المعتمدة على CPU سليمة لكنها بطيئة.
</ParamField>

---

## إعداد البحث الهجين

كلها ضمن `memorySearch.query.hybrid`:

| المفتاح               | النوع     | الافتراضي | الوصف                              |
| --------------------- | --------- | ------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`  | تفعيل البحث الهجين BM25 + المتجهي |
| `vectorWeight`        | `number`  | `0.7`   | وزن درجات المتجهات (0-1)          |
| `textWeight`          | `number`  | `0.3`   | وزن درجات BM25 (0-1)              |
| `candidateMultiplier` | `number`  | `4`     | مضاعف حجم مجموعة المرشحين         |

<Tabs>
  <Tab title="MMR (diversity)">
    | المفتاح      | النوع     | الافتراضي | الوصف                                  |
    | ------------- | --------- | ------- | ------------------------------------ |
    | `mmr.enabled` | `boolean` | `false` | تفعيل إعادة الترتيب باستخدام MMR      |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = أقصى تنوع، 1 = أقصى صلة          |
  </Tab>
  <Tab title="Temporal decay (recency)">
    | المفتاح                     | النوع     | الافتراضي | الوصف                    |
    | ---------------------------- | --------- | ------- | ------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | تفعيل تعزيز الحداثة       |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | تنخفض الدرجة إلى النصف كل N يوم |

    لا تُطبّق أي إضمحلال زمني على الملفات الدائمة (`MEMORY.md`، والملفات غير المؤرخة في `memory/`).

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

| المفتاح      | النوع      | الوصف                                      |
| ------------ | ---------- | ------------------------------------------ |
| `extraPaths` | `string[]` | أدلة أو ملفات إضافية لفهرستها |

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

للبحث في نصوص المحادثات بين الوكلاء ضمن نطاق الوكيل، استخدم `agents.list[].memorySearch.qmd.extraCollections` بدلًا من `memory.qmd.paths`. تتبع تلك المجموعات الإضافية الشكل نفسه `{ path, name, pattern? }`، لكنها تُدمج لكل وكيل ويمكنها الاحتفاظ بأسماء مشتركة صريحة عندما يشير المسار إلى خارج مساحة العمل الحالية. إذا ظهر المسار المحلول نفسه في كل من `memory.qmd.paths` و`memorySearch.qmd.extraCollections`، يحتفظ QMD بالإدخال الأول ويتخطى التكرار.

---

## الذاكرة متعددة الوسائط (Gemini)

افهرس الصور والصوت إلى جانب Markdown باستخدام Gemini Embedding 2:

| المفتاح                  | النوع      | الافتراضي | الوصف                                  |
| ------------------------ | ---------- | --------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`   | تفعيل الفهرسة متعددة الوسائط |
| `multimodal.modalities`   | `string[]` | --        | `["image"]` أو `["audio"]` أو `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | الحد الأقصى لحجم الملف للفهرسة |

<Note>
ينطبق فقط على الملفات في `extraPaths`. تبقى جذور الذاكرة الافتراضية مقتصرة على Markdown. يتطلب `gemini-embedding-2-preview`. يجب أن تكون `fallback` هي `"none"`.
</Note>

التنسيقات المدعومة: `.jpg`، `.jpeg`، `.png`، `.webp`، `.gif`، `.heic`، `.heif` (صور)؛ `.mp3`، `.wav`، `.ogg`، `.opus`، `.m4a`، `.aac`، `.flac` (صوت).

---

## ذاكرة التخزين المؤقت للتضمينات

| المفتاح           | النوع     | الافتراضي | الوصف                                  |
| ----------------- | --------- | --------- | -------------------------------------- |
| `cache.enabled`    | `boolean` | `true`    | تخزين تضمينات المقاطع مؤقتًا في SQLite |
| `cache.maxEntries` | `number`  | `50000`   | الحد الأقصى للتضمينات المخزنة مؤقتًا |

يمنع إعادة تضمين النص غير المتغير أثناء إعادة الفهرسة أو تحديثات نصوص المحادثات.

---

## الفهرسة بالدفعات

| المفتاح                      | النوع     | الافتراضي | الوصف                         |
| ---------------------------- | --------- | --------- | ----------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`       | تضمينات مضمنة متوازية |
| `remote.batch.enabled`        | `boolean` | `false`   | تفعيل API التضمين بالدفعات |
| `remote.batch.concurrency`    | `number`  | `2`       | مهام دفعات متوازية |
| `remote.batch.wait`           | `boolean` | `true`    | الانتظار حتى اكتمال الدفعة |
| `remote.batch.pollIntervalMs` | `number`  | --        | فترة الاستطلاع |
| `remote.batch.timeoutMinutes` | `number`  | --        | مهلة الدفعة |

متاح لـ `openai` و`gemini` و`voyage`. عادةً ما تكون دفعات OpenAI الأسرع والأقل تكلفة لعمليات الملء الخلفي الكبيرة.

يتحكم `remote.nonBatchConcurrency` في استدعاءات التضمين المضمنة التي يستخدمها موفرو الخدمة المحليون/ذوو الاستضافة الذاتية والموفرون المستضافون عندما لا تكون واجهات API الدفعات لدى الموفر نشطة. يضبط Ollama القيمة الافتراضية إلى `1` للفهرسة غير الدفعية لتجنب إرهاق المضيفين المحليين الأصغر؛ عيّن قيمة أعلى على الأجهزة الأكبر.

هذا منفصل عن `sync.embeddingBatchTimeoutSeconds`، الذي يتحكم في مهلة استدعاءات التضمين المضمنة.

---

## بحث ذاكرة الجلسة (تجريبي)

افهرس نصوص محادثات الجلسات واعرضها عبر `memory_search`:

| المفتاح                      | النوع      | الافتراضي   | الوصف                                      |
| ---------------------------- | ---------- | ----------- | ------------------------------------------ |
| `experimental.sessionMemory`  | `boolean`  | `false`     | تفعيل فهرسة الجلسات |
| `sources`                     | `string[]` | `["memory"]` | أضف `"sessions"`` لتضمين نصوص المحادثات |
| `sync.sessions.deltaBytes`    | `number`   | `100000`    | عتبة البايت لإعادة الفهرسة |
| `sync.sessions.deltaMessages` | `number`   | `50`        | عتبة الرسائل لإعادة الفهرسة |

<Warning>
فهرسة الجلسات اختيارية وتعمل بشكل غير متزامن. قد تكون النتائج قديمة قليلًا. توجد سجلات الجلسات على القرص، لذا تعامل مع الوصول إلى نظام الملفات باعتباره حد الثقة.
</Warning>

تخضع نتائج نصوص الجلسات أيضًا لإعداد
[`tools.sessions.visibility`](/gateway/config-tools#toolssessions). لا تكشف رؤية
`tree` الافتراضية إلا الجلسة الحالية والجلسات التي أنشأتها. لاستدعاء جلسة غير مرتبطة للوكيل نفسه أرسلها Gateway من جلسة مختلفة، مثل رسالة مباشرة، وسّع الرؤية عمدًا إلى `agent` (أو `all` فقط عندما يكون الاستدعاء عبر وكلاء متعددين مطلوبًا أيضًا وتسمح به سياسة الوكيل إلى الوكيل).

تضع الأمثلة أدناه هذه الإعدادات ضمن `agents.defaults`. يمكنك أيضًا تطبيق إعدادات `memorySearch` المكافئة في تجاوز خاص بكل وكيل عندما يجب أن يفهرس وكيل واحد فقط نصوص الجلسات ويبحث فيها.

للاستدعاء من Gateway إلى رسالة مباشرة للوكيل نفسه:

<Tabs>
  <Tab title="Builtin backend">__OC_I18N_900009__  </Tab>
  <Tab title="QMD backend">__OC_I18N_900010__  </Tab>
</Tabs>

عند استخدام QMD، لا يصدر `agents.defaults.memorySearch.experimental.sessionMemory` و
`sources: ["sessions"]` نصوص الجلسات إلى QMD بمفردهما. اضبط
`memory.qmd.sessions.enabled: true` أيضًا.

---

## تسريع المتجهات في SQLite (sqlite-vec)

| المفتاح                     | النوع     | الافتراضي | الوصف                                |
| --------------------------- | --------- | --------- | ------------------------------------ |
| `store.vector.enabled`      | `boolean` | `true`    | استخدم sqlite-vec لاستعلامات المتجهات |
| `store.vector.extensionPath` | `string` | مضمّن     | تجاوز مسار sqlite-vec                |

عندما لا يتوفر sqlite-vec، يعود OpenClaw تلقائيًا إلى تشابه جيب التمام داخل العملية.

---

## تخزين الفهارس

توجد فهارس الذاكرة المضمّنة في قاعدة بيانات SQLite الخاصة بكل وكيل في OpenClaw عند
`agents/<agentId>/agent/openclaw-agent.sqlite`.

| المفتاح               | النوع    | الافتراضي | الوصف                                      |
| --------------------- | -------- | --------- | ------------------------------------------ |
| `store.fts.tokenizer` | `string` | `unicode61` | محلل FTS5 الرمزي (`unicode61` أو `trigram`) |

---

## إعداد واجهة QMD الخلفية

اضبط `memory.backend = "qmd"` للتمكين. توجد كل إعدادات QMD ضمن `memory.qmd`:

| المفتاح                 | النوع     | الافتراضي | الوصف                                                                 |
| ----------------------- | --------- | ---------- | ---------------------------------------------------------------------- |
| `command`               | `string`  | `qmd`      | مسار ملف QMD التنفيذي؛ اضبط مسارًا مطلقًا عندما يختلف `PATH` للخدمة عن shell لديك |
| `searchMode`            | `string`  | `search`   | أمر البحث: `search`، `vsearch`، `query`                              |
| `rerank`                | `boolean` | --         | اضبطه على `false` مع `searchMode: "query"` وQMD 2.1+ لتخطي إعادة الترتيب في QMD |
| `includeDefaultMemory`  | `boolean` | `true`     | فهرسة `MEMORY.md` + `memory/**/*.md` تلقائيًا                         |
| `paths[]`               | `array`   | --         | مسارات إضافية: `{ name, path, pattern? }`                             |
| `sessions.enabled`      | `boolean` | `false`    | تصدير نصوص الجلسات إلى QMD                                            |
| `sessions.retentionDays` | `number` | --         | الاحتفاظ بالنصوص                                                       |
| `sessions.exportDir`    | `string`  | --         | دليل التصدير                                                          |

`searchMode: "search"` مخصص للبحث المعجمي/BM25 فقط. لا يشغّل OpenClaw فحوص جاهزية المتجهات الدلالية أو صيانة تضمينات QMD لهذا الوضع، بما في ذلك أثناء `memory status --deep`؛ ويستمر `vsearch` و`query` في طلب جاهزية متجهات QMD والتضمينات.

يغيّر `rerank: false` وضع `query` في QMD فقط ويتطلب QMD 2.1 أو أحدث. في وضع CLI المباشر، يمرر OpenClaw الخيار `--no-rerank`؛ وفي وضع MCP المدعوم بـ mcporter، يمرر `rerank: false` إلى أداة الاستعلام الموحدة في QMD. اتركه غير مضبوط لاستخدام سلوك إعادة ترتيب الاستعلام الافتراضي في QMD.

يفضل OpenClaw أشكال مجموعات QMD واستعلامات MCP الحالية، لكنه يبقي إصدارات QMD الأقدم عاملة عبر تجربة أعلام أنماط المجموعات المتوافقة وأسماء أدوات MCP الأقدم عند الحاجة. عندما يعلن QMD دعمه لمرشحات مجموعات متعددة، يُبحث في المجموعات ذات المصدر نفسه بعملية QMD واحدة؛ وتحتفظ إصدارات QMD الأقدم بمسار التوافق لكل مجموعة. تعني المجموعات ذات المصدر نفسه أن مجموعات الذاكرة الدائمة تُجمع معًا، بينما تبقى مجموعات نصوص الجلسات مجموعة منفصلة حتى يظل تنويع المصادر مشتملًا على كلا المدخلين.

<Note>
تبقى تجاوزات نماذج QMD في جانب QMD، وليس في إعدادات OpenClaw. إذا احتجت إلى تجاوز نماذج QMD عالميًا، فاضبط متغيرات البيئة مثل `QMD_EMBED_MODEL` و`QMD_RERANK_MODEL` و`QMD_GENERATE_MODEL` في بيئة تشغيل Gateway.
</Note>

<AccordionGroup>
  <Accordion title="جدول التحديث">
    | المفتاح                  | النوع     | الافتراضي | الوصف                                |
    | ------------------------- | --------- | ------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | فاصل التحديث                         |
    | `update.debounceMs`       | `number`  | `15000` | تأجيل تغييرات الملفات                |
    | `update.onBoot`           | `boolean` | `true`  | التحديث عند فتح مدير QMD طويل العمر؛ اضبطه على false لتخطي تحديث التمهيد الفوري |
    | `update.startup`          | `string`  | `off`   | تهيئة QMD اختيارية عند بدء Gateway: `off` أو `idle` أو `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | التأخير قبل تشغيل تحديث `startup: "idle"` |
    | `update.waitForBootSync`  | `boolean` | `false` | منع فتح المدير حتى يكتمل تحديثه الأولي |
    | `update.embedInterval`    | `string`  | --      | وتيرة تضمين منفصلة                  |
    | `update.commandTimeoutMs` | `number`  | --      | مهلة أوامر QMD                       |
    | `update.updateTimeoutMs`  | `number`  | --      | مهلة عمليات تحديث QMD                |
    | `update.embedTimeoutMs`   | `number`  | --      | مهلة عمليات تضمين QMD                |
  </Accordion>
  <Accordion title="الحدود">
    | المفتاح                  | النوع    | الافتراضي | الوصف                     |
    | ------------------------- | -------- | ------- | -------------------------- |
    | `limits.maxResults`       | `number` | `6`     | الحد الأقصى لنتائج البحث  |
    | `limits.maxSnippetChars`  | `number` | --      | تقييد طول المقتطف         |
    | `limits.maxInjectedChars` | `number` | --      | تقييد إجمالي الأحرف المحقونة |
    | `limits.timeoutMs`        | `number` | `4000`  | مهلة البحث                |
  </Accordion>
  <Accordion title="النطاق">
    يتحكم في الجلسات التي يمكنها تلقي نتائج بحث QMD. يستخدم المخطط نفسه مثل [`session.sendPolicy`](/gateway/config-agents#session):
__OC_I18N_900011__
    يسمح الإعداد الافتراضي المرفق بجلسات الرسائل المباشرة والقنوات، مع الاستمرار في رفض المجموعات.

    الإعداد الافتراضي مخصص للرسائل المباشرة فقط. يطابق `match.keyPrefix` مفتاح الجلسة المعياري؛ ويطابق `match.rawKeyPrefix` المفتاح الخام بما في ذلك `agent:<id>:`.

  </Accordion>
  <Accordion title="الاقتباسات">
    ينطبق `memory.citations` على كل الخلفيات:

    | القيمة            | السلوك                                             |
    | ---------------- | --------------------------------------------------- |
    | `auto` (الافتراضي) | تضمين تذييل `Source: <path#line>` في المقتطفات    |
    | `on`             | تضمين التذييل دائمًا                               |
    | `off`            | حذف التذييل (يبقى المسار ممررًا إلى الوكيل داخليًا) |

  </Accordion>
</AccordionGroup>

عند تفعيل تهيئة QMD عند بدء Gateway، يشغل OpenClaw QMD للوكلاء المؤهلين فقط. إذا كانت `update.onBoot` تساوي true ولم تُضبط صيانة للفاصل الزمني أو التضمين، يستخدم بدء التشغيل مديرًا لمرة واحدة لتحديث التمهيد ثم يغلقه. إذا ضُبط فاصل تحديث أو تضمين، يفتح بدء التشغيل مدير QMD طويل العمر حتى يتولى المراقب ومؤقتات الفواصل؛ يتخطى `update.onBoot: false` تحديث التمهيد الفوري فقط.

### مثال QMD كامل
__OC_I18N_900012__
---

## Dreaming

تُضبط Dreaming ضمن `plugins.entries.memory-core.config.dreaming`، وليس ضمن `agents.defaults.memorySearch`.

تعمل Dreaming كعملية مسح مجدولة واحدة وتستخدم مراحل خفيفة/عميقة/REM داخلية كتفصيل تنفيذي.

للاطلاع على السلوك المفاهيمي وأوامر الشرطة المائلة، راجع [Dreaming](/concepts/dreaming).

### إعدادات المستخدم

| المفتاح                                | النوع     | الافتراضي       | الوصف                                                                                                                          |
| -------------------------------------- | --------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`       | تفعيل Dreaming أو تعطيلها بالكامل                                                                                               |
| `frequency`                            | `string`  | `0 3 * * *`   | وتيرة Cron اختيارية لمسح Dreaming الكامل                                                                                        |
| `model`                                | `string`  | النموذج الافتراضي | تجاوز اختياري لنموذج الوكيل الفرعي Dream Diary                                                                                  |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`         | الحد الأقصى المقدر للرموز المحفوظة من كل مقتطف استدعاء قصير الأمد تتم ترقيته إلى `MEMORY.md`؛ تبقى بيانات المصدر الوصفية مرئية |

### مثال
__OC_I18N_900013__
<Note>
- تكتب Dreaming حالة الآلة إلى `memory/.dreams/`.
- تكتب Dreaming مخرجات سردية قابلة للقراءة البشرية إلى `DREAMS.md` (أو `dreams.md` الموجود).
- يستخدم `dreaming.model` بوابة الثقة الحالية للوكيل الفرعي في Plugin؛ اضبط `plugins.entries.memory-core.subagent.allowModelOverride: true` قبل تفعيله.
- يعيد Dream Diary المحاولة مرة واحدة باستخدام النموذج الافتراضي للجلسة عندما يكون النموذج المضبوط غير متاح. تُسجل إخفاقات الثقة أو قائمة السماح ولا يُعاد المحاولة بصمت.
- سياسة مراحل خفيفة/عميقة/REM والعتبات سلوك داخلي، وليست إعدادات موجهة للمستخدم.

</Note>

## ذو صلة

- [مرجع التهيئة](/ar/gateway/configuration-reference)
- [نظرة عامة على الذاكرة](/ar/concepts/memory)
- [البحث في الذاكرة](/ar/concepts/memory-search)
