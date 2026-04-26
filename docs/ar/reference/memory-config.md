---
read_when:
    - تريد تكوين موفري البحث في الذاكرة أو نماذج التضمين
    - تريد إعداد الواجهة الخلفية لـ QMD
    - تريد ضبط البحث الهجين أو MMR أو التناقص الزمني
    - تريد تمكين فهرسة الذاكرة متعددة الوسائط
sidebarTitle: Memory config
summary: جميع عناصر التكوين الخاصة بـ memory search، وموفري embeddings، وQMD، والبحث الهجين، والفهرسة متعددة الوسائط
title: مرجع تكوين Memory
x-i18n:
    generated_at: "2026-04-26T11:39:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15fd747abc6d0d43cfc869faa0b5e6c1618681ef3b02068207321d60d449a901
    source_path: reference/memory-config.md
    workflow: 15
---

تسرد هذه الصفحة كل خيارات التكوين الخاصة ببحث الذاكرة في OpenClaw. للاطلاع على نظرات عامة مفاهيمية، راجع:

<CardGroup cols={2}>
  <Card title="نظرة عامة على الذاكرة" href="/ar/concepts/memory">
    كيف تعمل الذاكرة.
  </Card>
  <Card title="المحرك المدمج" href="/ar/concepts/memory-builtin">
    الواجهة الخلفية الافتراضية لـ SQLite.
  </Card>
  <Card title="محرك QMD" href="/ar/concepts/memory-qmd">
    مكوّن جانبي محلي أولًا.
  </Card>
  <Card title="بحث الذاكرة" href="/ar/concepts/memory-search">
    مسار البحث وضبطه.
  </Card>
  <Card title="Active Memory" href="/ar/concepts/active-memory">
    وكيل فرعي للذاكرة للجلسات التفاعلية.
  </Card>
</CardGroup>

توجد جميع إعدادات بحث الذاكرة تحت `agents.defaults.memorySearch` في `openclaw.json` ما لم يُذكر خلاف ذلك.

<Note>
إذا كنت تبحث عن مفتاح تبديل ميزة **Active Memory** وإعدادات الوكيل الفرعي، فهي موجودة تحت `plugins.entries.active-memory` بدلًا من `memorySearch`.

تستخدم Active Memory نموذجًا قائمًا على شرطين:

1. يجب أن يكون الـ Plugin مفعّلًا ويستهدف معرّف الوكيل الحالي
2. يجب أن يكون الطلب جلسة دردشة تفاعلية مستمرة مؤهلة

راجع [Active Memory](/ar/concepts/active-memory) لمعرفة نموذج التفعيل، والإعدادات التي يملكها الـ Plugin، واستمرارية نصوص المحادثات، ونمط الطرح الآمن.
</Note>

---

## اختيار الموفّر

| المفتاح | النوع | الافتراضي | الوصف |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | يُكتشف تلقائيًا | معرّف مهايئ التضمين: `bedrock`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `voyage` |
| `model`    | `string`  | الافتراضي الخاص بالموفّر | اسم نموذج التضمين |
| `fallback` | `string`  | `"none"`         | معرّف المهايئ الاحتياطي عند فشل الأساسي |
| `enabled`  | `boolean` | `true`           | تمكين أو تعطيل بحث الذاكرة |

### ترتيب الاكتشاف التلقائي

عند عدم تعيين `provider`، يختار OpenClaw أول خيار متاح:

<Steps>
  <Step title="local">
    يتم اختياره إذا تم تكوين `memorySearch.local.modelPath` وكان الملف موجودًا.
  </Step>
  <Step title="github-copilot">
    يتم اختياره إذا أمكن تحديد رمز GitHub Copilot (متغيّر بيئة أو ملف تعريف مصادقة).
  </Step>
  <Step title="openai">
    يتم اختياره إذا أمكن تحديد مفتاح OpenAI.
  </Step>
  <Step title="gemini">
    يتم اختياره إذا أمكن تحديد مفتاح Gemini.
  </Step>
  <Step title="voyage">
    يتم اختياره إذا أمكن تحديد مفتاح Voyage.
  </Step>
  <Step title="mistral">
    يتم اختياره إذا أمكن تحديد مفتاح Mistral.
  </Step>
  <Step title="bedrock">
    يتم اختياره إذا نجحت سلسلة بيانات الاعتماد الخاصة بـ AWS SDK (دور المثيل، أو مفاتيح الوصول، أو الملف الشخصي، أو SSO، أو هوية الويب، أو الإعدادات المشتركة).
  </Step>
</Steps>

`ollama` مدعوم لكنه لا يُكتشف تلقائيًا (قم بتعيينه صراحةً).

### تحليل مفتاح API

تتطلب التضمينات البعيدة مفتاح API. يستخدم Bedrock بدلًا من ذلك سلسلة بيانات الاعتماد الافتراضية لـ AWS SDK (أدوار المثيل، وSSO، ومفاتيح الوصول).

| الموفّر | متغيّر البيئة | مفتاح التكوين |
| -------------- | -------------------------------------------------- | --------------------------------- |
| Bedrock        | سلسلة بيانات اعتماد AWS | لا حاجة إلى مفتاح API |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`  |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | ملف تعريف مصادقة عبر تسجيل دخول الجهاز |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey` |
| Ollama         | `OLLAMA_API_KEY` (عنصر نائب)                     | --                                |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`  |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`  |

<Note>
يغطي Codex OAuth الدردشة/الإكمالات فقط ولا يلبّي طلبات التضمين.
</Note>

---

## تكوين نقطة النهاية البعيدة

لنقاط النهاية المخصّصة المتوافقة مع OpenAI أو لتجاوز الإعدادات الافتراضية للموفّر:

<ParamField path="remote.baseUrl" type="string">
  عنوان URL أساسي مخصّص للـ API.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  تجاوز مفتاح API.
</ParamField>
<ParamField path="remote.headers" type="object">
  رؤوس HTTP إضافية (تُدمج مع الإعدادات الافتراضية للموفّر).
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

## تكوينات خاصة بالموفّر

<AccordionGroup>
  <Accordion title="Gemini">
    | المفتاح | النوع | الافتراضي | الوصف |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | يدعم أيضًا `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                 | بالنسبة إلى Embedding 2: ‏768 أو 1536 أو 3072 |

    <Warning>
    يؤدي تغيير النموذج أو `outputDimensionality` إلى إعادة فهرسة كاملة تلقائيًا.
    </Warning>

  </Accordion>
  <Accordion title="Bedrock">
    يستخدم Bedrock سلسلة بيانات الاعتماد الافتراضية لـ AWS SDK — لا حاجة إلى مفاتيح API. إذا كان OpenClaw يعمل على EC2 مع دور مثيل مفعّل لـ Bedrock، فما عليك سوى تعيين الموفّر والنموذج:

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

    | المفتاح | النوع | الافتراضي | الوصف |
    | ---------------------- | -------- | ------------------------------ | ------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | أي معرّف نموذج تضمين في Bedrock |
    | `outputDimensionality` | `number` | الافتراضي الخاص بالنموذج | بالنسبة إلى Titan V2: ‏256 أو 512 أو 1024 |

    **النماذج المدعومة** (مع اكتشاف العائلة وإعدادات الأبعاد الافتراضية):

    | معرّف النموذج | الموفّر | الأبعاد الافتراضية | الأبعاد القابلة للتكوين |
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

    ترث المتغيرات ذات لاحقة معدل النقل (مثل `amazon.titan-embed-text-v1:2:8k`) إعدادات النموذج الأساسي.

    **المصادقة:** تستخدم مصادقة Bedrock ترتيب تحليل بيانات الاعتماد القياسي في AWS SDK:

    1. متغيّرات البيئة (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. ذاكرة التخزين المؤقت لرمز SSO
    3. بيانات اعتماد رموز هوية الويب
    4. ملفات بيانات الاعتماد والإعدادات المشتركة
    5. بيانات اعتماد بيانات ECS أو EC2 الوصفية

    يتم تحليل المنطقة من `AWS_REGION` أو `AWS_DEFAULT_REGION` أو `baseUrl` لموفّر `amazon-bedrock`، أو تكون افتراضيًا `us-east-1`.

    **أذونات IAM:** يحتاج دور IAM أو المستخدم إلى:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    لأقل قدر من الامتيازات، اجعل نطاق `InvokeModel` مقتصرًا على النموذج المحدد:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="محلي (GGUF + node-llama-cpp)">
    | المفتاح | النوع | الافتراضي | الوصف |
    | --------------------- | ------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | يتم تنزيله تلقائيًا | المسار إلى ملف نموذج GGUF |
    | `local.modelCacheDir` | `string`           | الافتراضي في node-llama-cpp | دليل التخزين المؤقت للنماذج التي تم تنزيلها |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | حجم نافذة السياق لسياق التضمين. يغطي 4096 المقاطع النموذجية (128–512 رمزًا) مع تقييد VRAM غير الخاص بالأوزان. اخفضه إلى 1024–2048 على الأجهزة محدودة الموارد. يستخدم `"auto"` الحد الأقصى المدرَّب للنموذج — غير موصى به لنماذج 8B+ (Qwen3-Embedding-8B: ‏40 960 رمزًا → نحو 32 GB VRAM مقابل نحو 8.8 GB عند 4096). |

    النموذج الافتراضي: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB، يتم تنزيله تلقائيًا). يتطلب بناءً أصليًا: `pnpm approve-builds` ثم `pnpm rebuild node-llama-cpp`.

    استخدم CLI المستقل للتحقق من مسار الموفّر نفسه الذي يستخدمه Gateway:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    إذا كانت قيمة `provider` هي `auto`، فسيتم اختيار `local` فقط عندما يشير `local.modelPath` إلى ملف محلي موجود. لا يزال بالإمكان استخدام مراجع نماذج `hf:` وHTTP(S) صراحةً مع `provider: "local"`، لكنها لا تجعل `auto` يختار `local` قبل أن يصبح النموذج متاحًا على القرص.

  </Accordion>
</AccordionGroup>

### مهلة التضمين المضمّن

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  تجاوز المهلة الزمنية لدفعات التضمين المضمّنة أثناء فهرسة الذاكرة.

عند عدم التعيين، يُستخدم الإعداد الافتراضي الخاص بالموفّر: 600 ثانية للموفّرين المحليين/المستضافين ذاتيًا مثل `local` و`ollama` و`lmstudio`، و120 ثانية للموفّرين المستضافين. قم بزيادة هذه القيمة عندما تكون دفعات التضمين المحلية المعتمدة على CPU سليمة لكنها بطيئة.
</ParamField>

---

## تكوين البحث الهجين

كلها ضمن `memorySearch.query.hybrid`:

| المفتاح | النوع | الافتراضي | الوصف |
| --------------------- | --------- | ------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`  | تمكين البحث الهجين BM25 + المتجهي |
| `vectorWeight`        | `number`  | `0.7`   | الوزن لدرجات المتجهات (0-1) |
| `textWeight`          | `number`  | `0.3`   | الوزن لدرجات BM25 (0-1) |
| `candidateMultiplier` | `number`  | `4`     | مضاعف حجم مجموعة المرشحين |

<Tabs>
  <Tab title="MMR (التنوّع)">
    | المفتاح | النوع | الافتراضي | الوصف |
    | ------------- | --------- | ------- | ------------------------------------ |
    | `mmr.enabled` | `boolean` | `false` | تمكين إعادة الترتيب باستخدام MMR |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = أقصى تنوّع، 1 = أقصى صلة |
  </Tab>
  <Tab title="التناقص الزمني (الحداثة)">
    | المفتاح | النوع | الافتراضي | الوصف |
    | ---------------------------- | --------- | ------- | ------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | تمكين تعزيز الحداثة |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | تنخفض الدرجة إلى النصف كل N يومًا |

    الملفات الدائمة (`MEMORY.md`، والملفات غير المؤرخة في `memory/`) لا يطبَّق عليها التناقص أبدًا.

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

| المفتاح | النوع | الوصف |
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

يمكن أن تكون المسارات مطلقة أو نسبة إلى مساحة العمل. تُفحص الأدلة بشكل تكراري بحثًا عن ملفات `.md`. يعتمد التعامل مع الروابط الرمزية على الواجهة الخلفية النشطة: يتجاهل المحرك المدمج الروابط الرمزية، بينما يتبع QMD سلوك ماسح QMD الأساسي.

للبحث في نصوص المحادثات عبر الوكلاء ضمن نطاق وكيل معيّن، استخدم `agents.list[].memorySearch.qmd.extraCollections` بدلًا من `memory.qmd.paths`. تتبع هذه المجموعات الإضافية الشكل نفسه `{ path, name, pattern? }`، لكنها تُدمج لكل وكيل ويمكنها الحفاظ على الأسماء المشتركة الصريحة عندما يشير المسار إلى خارج مساحة العمل الحالية. إذا ظهر المسار المحلول نفسه في كلٍّ من `memory.qmd.paths` و`memorySearch.qmd.extraCollections`، يحتفظ QMD بالإدخال الأول ويتخطى الإدخال المكرر.

---

## الذاكرة متعددة الوسائط (Gemini)

قم بفهرسة الصور والصوت إلى جانب Markdown باستخدام Gemini Embedding 2:

| المفتاح | النوع | الافتراضي | الوصف |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | تمكين الفهرسة متعددة الوسائط |
| `multimodal.modalities`   | `string[]` | --         | `["image"]` أو `["audio"]` أو `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | الحد الأقصى لحجم الملف للفهرسة |

<Note>
ينطبق هذا فقط على الملفات الموجودة في `extraPaths`. تظل جذور الذاكرة الافتراضية مقتصرة على Markdown. يتطلب `gemini-embedding-2-preview`. يجب أن تكون قيمة `fallback` هي `"none"`.
</Note>

التنسيقات المدعومة: `.jpg` و`.jpeg` و`.png` و`.webp` و`.gif` و`.heic` و`.heif` (للصور)؛ `.mp3` و`.wav` و`.ogg` و`.opus` و`.m4a` و`.aac` و`.flac` (للصوت).

---

## ذاكرة التخزين المؤقت للتضمين

| المفتاح | النوع | الافتراضي | الوصف |
| ------------------ | --------- | ------- | -------------------------------- |
| `cache.enabled`    | `boolean` | `false` | تخزين تضمينات المقاطع مؤقتًا في SQLite |
| `cache.maxEntries` | `number`  | `50000` | الحد الأقصى للتضمينات المخزنة مؤقتًا |

يمنع إعادة تضمين النص غير المتغير أثناء إعادة الفهرسة أو تحديثات نصوص المحادثات.

---

## الفهرسة على دفعات

| المفتاح | النوع | الافتراضي | الوصف |
| ----------------------------- | --------- | ------- | -------------------------- |
| `remote.batch.enabled`        | `boolean` | `false` | تمكين API التضمين على دفعات |
| `remote.batch.concurrency`    | `number`  | `2`     | مهام الدفعات المتوازية |
| `remote.batch.wait`           | `boolean` | `true`  | انتظار اكتمال الدفعة |
| `remote.batch.pollIntervalMs` | `number`  | --      | الفاصل الزمني للاستطلاع |
| `remote.batch.timeoutMinutes` | `number`  | --      | المهلة الزمنية للدفعة |

متاح لـ `openai` و`gemini` و`voyage`. تكون دفعات OpenAI عادةً الأسرع والأقل تكلفة لعمليات التعبئة الخلفية الكبيرة.

هذا منفصل عن `sync.embeddingBatchTimeoutSeconds`، الذي يتحكم في استدعاءات التضمين المضمّنة المستخدمة من قِبل الموفّرين المحليين/المستضافين ذاتيًا والموفّرين المستضافين عندما لا تكون واجهات API الخاصة بالدفعات لدى الموفّر نشطة.

---

## بحث ذاكرة الجلسة (تجريبي)

قم بفهرسة نصوص محادثات الجلسات وإظهارها عبر `memory_search`:

| المفتاح | النوع | الافتراضي | الوصف |
| ----------------------------- | ---------- | ------------ | --------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | تمكين فهرسة الجلسات |
| `sources`                     | `string[]` | `["memory"]` | أضف `"sessions"` لتضمين نصوص المحادثات |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | حد البايتات لإعادة الفهرسة |
| `sync.sessions.deltaMessages` | `number`   | `50`         | حد الرسائل لإعادة الفهرسة |

<Warning>
فهرسة الجلسات اختيارية وتعمل بشكل غير متزامن. قد تكون النتائج قديمة قليلًا. تُخزَّن سجلات الجلسات على القرص، لذا اعتبر الوصول إلى نظام الملفات هو حد الثقة.
</Warning>

---

## تسريع المتجهات في SQLite ‏(sqlite-vec)

| المفتاح | النوع | الافتراضي | الوصف |
| ---------------------------- | --------- | ------- | --------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | استخدام sqlite-vec لاستعلامات المتجهات |
| `store.vector.extensionPath` | `string`  | مضمّن | تجاوز مسار sqlite-vec |

عندما لا يكون sqlite-vec متاحًا، يعود OpenClaw تلقائيًا إلى تشابه جيب التمام داخل العملية.

---

## تخزين الفهرس

| المفتاح | النوع | الافتراضي | الوصف |
| --------------------- | -------- | ------------------------------------- | ------------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | موقع الفهرس (يدعم الرمز `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                           | محلّل FTS5 (`unicode61` أو `trigram`) |

---

## تكوين الواجهة الخلفية لـ QMD

عيّن `memory.backend = "qmd"` للتمكين. توجد جميع إعدادات QMD تحت `memory.qmd`:

| المفتاح | النوع | الافتراضي | الوصف |
| ------------------------ | --------- | -------- | -------------------------------------------- |
| `command`                | `string`  | `qmd`    | مسار الملف التنفيذي لـ QMD |
| `searchMode`             | `string`  | `search` | أمر البحث: `search` أو `vsearch` أو `query` |
| `includeDefaultMemory`   | `boolean` | `true`   | فهرسة تلقائية لـ `MEMORY.md` و`memory/**/*.md` |
| `paths[]`                | `array`   | --       | مسارات إضافية: `{ name, path, pattern? }` |
| `sessions.enabled`       | `boolean` | `false`  | فهرسة نصوص محادثات الجلسات |
| `sessions.retentionDays` | `number`  | --       | مدة الاحتفاظ بنصوص المحادثات |
| `sessions.exportDir`     | `string`  | --       | دليل التصدير |

يفضّل OpenClaw أشكال الاستعلام الحالية الخاصة بمجموعات QMD وMCP، لكنه يُبقي إصدارات QMD الأقدم عاملة عبر الرجوع إلى علامات المجموعات القديمة `--mask` وأسماء أدوات MCP الأقدم عند الحاجة.

<Note>
تبقى تجاوزات نماذج QMD على جانب QMD، وليس في إعدادات OpenClaw. إذا كنت بحاجة إلى تجاوز نماذج QMD على مستوى عام، فاضبط متغيرات البيئة مثل `QMD_EMBED_MODEL` و`QMD_RERANK_MODEL` و`QMD_GENERATE_MODEL` في بيئة تشغيل Gateway.
</Note>

<AccordionGroup>
  <Accordion title="جدول التحديث">
    | المفتاح | النوع | الافتراضي | الوصف |
    | ------------------------- | --------- | ------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | فترة التحديث |
    | `update.debounceMs`       | `number`  | `15000` | إزالة ارتداد تغييرات الملفات |
    | `update.onBoot`           | `boolean` | `true`  | التحديث عند بدء التشغيل |
    | `update.waitForBootSync`  | `boolean` | `false` | حظر بدء التشغيل حتى اكتمال التحديث |
    | `update.embedInterval`    | `string`  | --      | وتيرة تضمين منفصلة |
    | `update.commandTimeoutMs` | `number`  | --      | المهلة الزمنية لأوامر QMD |
    | `update.updateTimeoutMs`  | `number`  | --      | المهلة الزمنية لعمليات تحديث QMD |
    | `update.embedTimeoutMs`   | `number`  | --      | المهلة الزمنية لعمليات تضمين QMD |
  </Accordion>
  <Accordion title="الحدود">
    | المفتاح | النوع | الافتراضي | الوصف |
    | ------------------------- | -------- | ------- | -------------------------- |
    | `limits.maxResults`       | `number` | `6`     | الحد الأقصى لنتائج البحث |
    | `limits.maxSnippetChars`  | `number` | --      | تقييد طول المقتطف |
    | `limits.maxInjectedChars` | `number` | --      | تقييد إجمالي الأحرف المُدرجة |
    | `limits.timeoutMs`        | `number` | `4000`  | المهلة الزمنية للبحث |
  </Accordion>
  <Accordion title="النطاق">
    يتحكم في الجلسات التي يمكنها تلقي نتائج بحث QMD. البنية نفسها كما في [`session.sendPolicy`](/ar/gateway/config-agents#session):

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

    يسمح الإعداد الافتراضي المضمّن بجلسات الرسائل المباشرة والقنوات، مع الاستمرار في رفض المجموعات.

    الافتراضي هو الرسائل المباشرة فقط. يطابق `match.keyPrefix` مفتاح الجلسة الموحَّد؛ ويطابق `match.rawKeyPrefix` المفتاح الخام بما في ذلك `agent:<id>:`.

  </Accordion>
  <Accordion title="الاستشهادات">
    ينطبق `memory.citations` على جميع الواجهات الخلفية:

    | القيمة | السلوك |
    | ---------------- | --------------------------------------------------- |
    | `auto` (الافتراضي) | تضمين تذييل `Source: <path#line>` في المقتطفات |
    | `on`             | تضمين التذييل دائمًا |
    | `off`            | حذف التذييل (مع استمرار تمرير المسار إلى الوكيل داخليًا) |

  </Accordion>
</AccordionGroup>

### مثال كامل على QMD

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

يتم تكوين Dreaming تحت `plugins.entries.memory-core.config.dreaming`، وليس تحت `agents.defaults.memorySearch`.

يعمل Dreaming كعملية اجتياح مجدولة واحدة ويستخدم المراحل الداخلية light/deep/REM كتفصيل تنفيذي.

للسلوك المفاهيمي وأوامر الشرطة المائلة، راجع [Dreaming](/ar/concepts/dreaming).

### إعدادات المستخدم

| المفتاح | النوع | الافتراضي | الوصف |
| ----------- | --------- | ----------- | ------------------------------------------------- |
| `enabled`   | `boolean` | `false`     | تمكين Dreaming أو تعطيله بالكامل |
| `frequency` | `string`  | `0 3 * * *` | وتيرة Cron اختيارية لاجتياح Dreaming الكامل |

### مثال

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        config: {
          dreaming: {
            enabled: true,
            frequency: "0 3 * * *",
          },
        },
      },
    },
  },
}
```

<Note>
- يكتب Dreaming حالة الآلة إلى `memory/.dreams/`.
- يكتب Dreaming مخرجات سردية قابلة للقراءة البشرية إلى `DREAMS.md` (أو `dreams.md` الموجود).
- تعد سياسة مراحل light/deep/REM والحدود الخاصة بها سلوكًا داخليًا، وليست إعدادات موجهة للمستخدم.
</Note>

## ذو صلة

- [مرجع التكوين](/ar/gateway/configuration-reference)
- [نظرة عامة على الذاكرة](/ar/concepts/memory)
- [بحث الذاكرة](/ar/concepts/memory-search)
