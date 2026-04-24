---
read_when:
    - تريد تهيئة موفّري بحث الذاكرة أو نماذج التضمين
    - تريد إعداد الواجهة الخلفية لـ QMD
    - تريد ضبط البحث الهجين أو MMR أو الاضمحلال الزمني
    - تريد تمكين فهرسة الذاكرة متعددة الوسائط
summary: جميع عناصر التحكم في التهيئة الخاصة ببحث الذاكرة، وموفّري التضمين، وQMD، والبحث الهجين، والفهرسة متعددة الوسائط
title: مرجع تهيئة الذاكرة
x-i18n:
    generated_at: "2026-04-24T08:02:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9152d6cdf3959319c2ba000fae06c72b27b9b8c90ee08ce57b80d1c0670f850
    source_path: reference/memory-config.md
    workflow: 15
---

تسرد هذه الصفحة جميع عناصر التحكم في تهيئة بحث الذاكرة في OpenClaw. للاطلاع على نظرات عامة مفاهيمية، راجع:

- [Memory Overview](/ar/concepts/memory) -- كيف تعمل الذاكرة
- [Builtin Engine](/ar/concepts/memory-builtin) -- الواجهة الخلفية الافتراضية SQLite
- [QMD Engine](/ar/concepts/memory-qmd) -- sidecar محلي أولًا
- [Memory Search](/ar/concepts/memory-search) -- خط أنابيب البحث والضبط
- [Active Memory](/ar/concepts/active-memory) -- تمكين الوكيل الفرعي للذاكرة للجلسات التفاعلية

توجد جميع إعدادات بحث الذاكرة ضمن `agents.defaults.memorySearch` في
`openclaw.json` ما لم يُذكر خلاف ذلك.

إذا كنت تبحث عن مفتاح تبديل ميزة **Active Memory** وتهيئة الوكيل الفرعي،
فهو يوجد ضمن `plugins.entries.active-memory` بدلًا من `memorySearch`.

تستخدم Active Memory نموذجًا ذا بوابتين:

1. يجب أن يكون Plugin مفعّلًا ويستهدف معرّف الوكيل الحالي
2. يجب أن يكون الطلب جلسة دردشة تفاعلية دائمة مؤهلة

راجع [Active Memory](/ar/concepts/active-memory) للاطلاع على نموذج التفعيل،
والتهيئة المملوكة لـ Plugin، واستمرارية النص، ونمط الطرح الآمن.

---

## اختيار الموفّر

| المفتاح   | النوع     | الافتراضي      | الوصف                                                                                                      |
| ---------- | --------- | -------------- | ---------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | يُكتشف تلقائيًا | معرّف مهايئ التضمين: `bedrock` و`gemini` و`github-copilot` و`local` و`mistral` و`ollama` و`openai` و`voyage` |
| `model`    | `string`  | افتراضي الموفّر | اسم نموذج التضمين                                                                                          |
| `fallback` | `string`  | `"none"`       | معرّف المهايئ الاحتياطي عند فشل الأساسي                                                                      |
| `enabled`  | `boolean` | `true`         | تمكين أو تعطيل بحث الذاكرة                                                                                 |

### ترتيب الاكتشاف التلقائي

عندما لا يتم ضبط `provider`، يختار OpenClaw أول خيار متاح:

1. `local` -- إذا كان `memorySearch.local.modelPath` مهيأً وكان الملف موجودًا.
2. `github-copilot` -- إذا أمكن حل رمز GitHub Copilot (متغير بيئة أو ملف تعريف مصادقة).
3. `openai` -- إذا أمكن حل مفتاح OpenAI.
4. `gemini` -- إذا أمكن حل مفتاح Gemini.
5. `voyage` -- إذا أمكن حل مفتاح Voyage.
6. `mistral` -- إذا أمكن حل مفتاح Mistral.
7. `bedrock` -- إذا أمكن حل سلسلة بيانات اعتماد AWS SDK (دور المثيل، أو مفاتيح الوصول، أو الملف الشخصي، أو SSO، أو هوية الويب، أو التهيئة المشتركة).

`ollama` مدعوم لكنه لا يُكتشف تلقائيًا (قم بضبطه صراحةً).

### حل مفتاح API

تتطلب عمليات التضمين البعيدة مفتاح API. أما Bedrock فيستخدم سلسلة
بيانات الاعتماد الافتراضية لـ AWS SDK بدلًا من ذلك (أدوار المثيل، وSSO، ومفاتيح الوصول).

| الموفّر         | متغير البيئة                                       | مفتاح التهيئة                     |
| --------------- | -------------------------------------------------- | --------------------------------- |
| Bedrock         | سلسلة بيانات اعتماد AWS                            | لا حاجة إلى مفتاح API             |
| Gemini          | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`  |
| GitHub Copilot  | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | ملف تعريف مصادقة عبر تسجيل دخول الجهاز |
| Mistral         | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey` |
| Ollama          | `OLLAMA_API_KEY` (عنصر نائب)                       | --                                |
| OpenAI          | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`  |
| Voyage          | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`  |

يغطي Codex OAuth الدردشة/الإكمالات فقط ولا يفي بطلبات التضمين.

---

## تهيئة نقطة النهاية البعيدة

لنقاط النهاية المخصصة المتوافقة مع OpenAI أو لتجاوز الإعدادات الافتراضية للموفّر:

| المفتاح         | النوع    | الوصف                                         |
| ---------------- | -------- | --------------------------------------------- |
| `remote.baseUrl` | `string` | Base URL مخصص لـ API                          |
| `remote.apiKey`  | `string` | تجاوز مفتاح API                               |
| `remote.headers` | `object` | رؤوس HTTP إضافية (تُدمج مع الإعدادات الافتراضية للموفّر) |

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

## تهيئة خاصة بـ Gemini

| المفتاح               | النوع    | الافتراضي             | الوصف                                     |
| --------------------- | -------- | --------------------- | ----------------------------------------- |
| `model`               | `string` | `gemini-embedding-001` | يدعم أيضًا `gemini-embedding-2-preview`   |
| `outputDimensionality` | `number` | `3072`                | بالنسبة إلى Embedding 2: ‏768 أو 1536 أو 3072 |

<Warning>
يؤدي تغيير النموذج أو `outputDimensionality` إلى إعادة فهرسة كاملة تلقائية.
</Warning>

---

## تهيئة التضمين لـ Bedrock

يستخدم Bedrock سلسلة بيانات الاعتماد الافتراضية لـ AWS SDK -- ولا حاجة إلى مفاتيح API.
إذا كان OpenClaw يعمل على EC2 مع دور مثيل مفعّل لـ Bedrock، فما عليك سوى ضبط
الموفّر والنموذج:

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

| المفتاح               | النوع    | الافتراضي                     | الوصف                            |
| --------------------- | -------- | ----------------------------- | -------------------------------- |
| `model`               | `string` | `amazon.titan-embed-text-v2:0` | أي معرّف نموذج تضمين لـ Bedrock  |
| `outputDimensionality` | `number` | الافتراضي الخاص بالنموذج       | بالنسبة إلى Titan V2: ‏256 أو 512 أو 1024 |

### النماذج المدعومة

النماذج التالية مدعومة (مع اكتشاف العائلة والإعدادات الافتراضية
للأبعاد):

| معرّف النموذج                                | الموفّر    | الأبعاد الافتراضية | الأبعاد القابلة للتهيئة |
| ------------------------------------------- | ---------- | ------------------ | ----------------------- |
| `amazon.titan-embed-text-v2:0`              | Amazon     | 1024               | 256، 512، 1024          |
| `amazon.titan-embed-text-v1`                | Amazon     | 1536               | --                      |
| `amazon.titan-embed-g1-text-02`             | Amazon     | 1536               | --                      |
| `amazon.titan-embed-image-v1`               | Amazon     | 1024               | --                      |
| `amazon.nova-2-multimodal-embeddings-v1:0`  | Amazon     | 1024               | 256، 384، 1024، 3072    |
| `cohere.embed-english-v3`                   | Cohere     | 1024               | --                      |
| `cohere.embed-multilingual-v3`              | Cohere     | 1024               | --                      |
| `cohere.embed-v4:0`                         | Cohere     | 1536               | 256-1536                |
| `twelvelabs.marengo-embed-3-0-v1:0`         | TwelveLabs | 512                | --                      |
| `twelvelabs.marengo-embed-2-7-v1:0`         | TwelveLabs | 1024               | --                      |

تَرِث الصيغ ذات لاحقة throughput (مثل `amazon.titan-embed-text-v1:2:8k`)
تهيئة النموذج الأساسي.

### المصادقة

تستخدم مصادقة Bedrock ترتيب حل بيانات الاعتماد القياسي في AWS SDK:

1. متغيرات البيئة (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
2. ذاكرة التخزين المؤقت لرمز SSO
3. بيانات اعتماد رمز هوية الويب
4. ملفات بيانات الاعتماد والتهيئة المشتركة
5. بيانات اعتماد metadata الخاصة بـ ECS أو EC2

تُحل المنطقة من `AWS_REGION` أو `AWS_DEFAULT_REGION` أو
`baseUrl` الخاص بموفّر `amazon-bedrock`، أو تكون افتراضيًا `us-east-1`.

### أذونات IAM

يحتاج دور IAM أو المستخدم إلى:

```json
{
  "Effect": "Allow",
  "Action": "bedrock:InvokeModel",
  "Resource": "*"
}
```

ولتطبيق مبدأ أقل الامتيازات، اجعل `InvokeModel` محصورًا في النموذج المحدد:

```
arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
```

---

## تهيئة التضمين المحلي

| المفتاح                | النوع              | الافتراضي               | الوصف                                                                                                                                                                                                                                                                                                             |
| ---------------------- | ------------------ | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `local.modelPath`      | `string`           | يُنزّل تلقائيًا         | المسار إلى ملف نموذج GGUF                                                                                                                                                                                                                                                                                         |
| `local.modelCacheDir`  | `string`           | الافتراضي لـ node-llama-cpp | دليل التخزين المؤقت للنماذج المُنزّلة                                                                                                                                                                                                                                                                            |
| `local.contextSize`    | `number \| "auto"` | `4096`                  | حجم نافذة السياق لسياق التضمين. يغطي 4096 المقاطع النموذجية (128–512 رمزًا) مع تقييد VRAM غير الخاص بالأوزان. اخفضه إلى 1024–2048 على المضيفات المقيّدة. تستخدم `"auto"` الحد الأقصى المدرّب للنموذج — وهو غير موصى به لنماذج 8B+ ‏(Qwen3-Embedding-8B: ‏40 960 رمزًا ← نحو 32 GB VRAM مقابل ~8.8 GB عند 4096). |

النموذج الافتراضي: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB، يُنزّل تلقائيًا).
يتطلب بناءً أصليًا: `pnpm approve-builds` ثم `pnpm rebuild node-llama-cpp`.

استخدم CLI المستقل للتحقق من مسار الموفّر نفسه الذي يستخدمه Gateway:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

إذا كان `provider` هو `auto`، فسيُختار `local` فقط عندما يشير
`local.modelPath` إلى ملف محلي موجود. ولا يزال من الممكن استخدام مراجع
النماذج `hf:` وHTTP(S) صراحةً مع `provider: "local"`، لكنها لا تجعل
`auto` يختار local قبل أن يصبح النموذج متاحًا على القرص.

---

## تهيئة البحث الهجين

كلها ضمن `memorySearch.query.hybrid`:

| المفتاح              | النوع     | الافتراضي | الوصف                                  |
| -------------------- | --------- | --------- | -------------------------------------- |
| `enabled`            | `boolean` | `true`    | تمكين البحث الهجين BM25 + المتجهي      |
| `vectorWeight`       | `number`  | `0.7`     | وزن الدرجات المتجهية (0-1)             |
| `textWeight`         | `number`  | `0.3`     | وزن درجات BM25 ‏(0-1)                  |
| `candidateMultiplier` | `number` | `4`       | مضاعِف حجم مجموعة المرشحين             |

### MMR ‏(التنوع)

| المفتاح       | النوع     | الافتراضي | الوصف                             |
| ------------- | --------- | --------- | --------------------------------- |
| `mmr.enabled` | `boolean` | `false`   | تمكين إعادة الترتيب باستخدام MMR  |
| `mmr.lambda`  | `number`  | `0.7`     | 0 = أقصى تنوع، 1 = أقصى صلة       |

### الاضمحلال الزمني (الحداثة)

| المفتاح                     | النوع     | الافتراضي | الوصف                    |
| --------------------------- | --------- | --------- | ------------------------ |
| `temporalDecay.enabled`     | `boolean` | `false`   | تمكين تعزيز الحداثة      |
| `temporalDecay.halfLifeDays` | `number` | `30`      | تنخفض الدرجة إلى النصف كل N يوم |

لا يطبَّق الاضمحلال أبدًا على الملفات الدائمة (`MEMORY.md` والملفات غير المؤرخة في `memory/`).

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

يمكن أن تكون المسارات مطلقة أو نسبية إلى مساحة العمل. وتُفحَص الأدلة
بشكل递归 للعثور على ملفات `.md`. ويعتمد التعامل مع الروابط الرمزية على
الواجهة الخلفية النشطة: إذ تتجاهلها الواجهة المضمنة، بينما يتبع QMD سلوك
الماسح الأساسي الخاص به.

بالنسبة إلى البحث في نصوص الوكلاء الآخرين ضمن نطاق الوكيل، استخدم
`agents.list[].memorySearch.qmd.extraCollections` بدلًا من `memory.qmd.paths`.
وتتبع هذه المجموعات الإضافية نفس البنية `{ path, name, pattern? }`، لكنها
تُدمج لكل وكيل ويمكنها الاحتفاظ بأسماء مشتركة صريحة عندما يشير المسار إلى
خارج مساحة العمل الحالية.
إذا ظهر المسار المحلول نفسه في كلٍّ من `memory.qmd.paths` و
`memorySearch.qmd.extraCollections`، فسيحتفظ QMD بالإدخال الأول ويتخطى
المكرر.

---

## الذاكرة متعددة الوسائط (Gemini)

يمكنك فهرسة الصور والصوت إلى جانب Markdown باستخدام Gemini Embedding 2:

| المفتاح                    | النوع      | الافتراضي | الوصف                                 |
| -------------------------- | ---------- | ---------- | ------------------------------------- |
| `multimodal.enabled`       | `boolean`  | `false`    | تمكين الفهرسة متعددة الوسائط          |
| `multimodal.modalities`    | `string[]` | --         | `["image"]` أو `["audio"]` أو `["all"]` |
| `multimodal.maxFileBytes`  | `number`   | `10000000` | الحد الأقصى لحجم الملف من أجل الفهرسة |

ينطبق هذا فقط على الملفات الموجودة في `extraPaths`. وتظل جذور الذاكرة
الافتراضية خاصة بـ Markdown فقط.
ويتطلب `gemini-embedding-2-preview`. ويجب أن تكون قيمة `fallback` هي `"none"`.

التنسيقات المدعومة: `.jpg` و`.jpeg` و`.png` و`.webp` و`.gif` و`.heic` و`.heif`
(صور)؛ و`.mp3` و`.wav` و`.ogg` و`.opus` و`.m4a` و`.aac` و`.flac` (صوت).

---

## ذاكرة التخزين المؤقت للتضمين

| المفتاح           | النوع     | الافتراضي | الوصف                              |
| ----------------- | --------- | --------- | ---------------------------------- |
| `cache.enabled`   | `boolean` | `false`   | تخزين تضمينات المقاطع مؤقتًا في SQLite |
| `cache.maxEntries` | `number` | `50000`   | الحد الأقصى للتضمينات المخزنة مؤقتًا |

يمنع إعادة تضمين النص غير المتغير أثناء إعادة الفهرسة أو تحديثات النص.

---

## الفهرسة الدفعية

| المفتاح                      | النوع     | الافتراضي | الوصف                      |
| ---------------------------- | --------- | --------- | -------------------------- |
| `remote.batch.enabled`       | `boolean` | `false`   | تمكين API التضمين الدفعي   |
| `remote.batch.concurrency`   | `number`  | `2`       | الوظائف الدفعية المتوازية  |
| `remote.batch.wait`          | `boolean` | `true`    | انتظار اكتمال الدفعة       |
| `remote.batch.pollIntervalMs` | `number` | --        | فترة الاستطلاع             |
| `remote.batch.timeoutMinutes` | `number` | --        | مهلة الدفعة                |

هذا متاح لـ `openai` و`gemini` و`voyage`. وعادةً ما تكون الدفعات في OpenAI
الأسرع والأرخص لعمليات الملء الخلفي الكبيرة.

---

## بحث ذاكرة الجلسة (تجريبي)

يمكنك فهرسة نصوص الجلسات وإظهارها عبر `memory_search`:

| المفتاح                      | النوع      | الافتراضي    | الوصف                                  |
| ---------------------------- | ---------- | ------------- | -------------------------------------- |
| `experimental.sessionMemory` | `boolean`  | `false`       | تمكين فهرسة الجلسات                    |
| `sources`                    | `string[]` | `["memory"]`  | أضف `"sessions"` لتضمين النصوص         |
| `sync.sessions.deltaBytes`   | `number`   | `100000`      | عتبة البايت لإعادة الفهرسة             |
| `sync.sessions.deltaMessages` | `number`  | `50`          | عتبة الرسائل لإعادة الفهرسة            |

تُعد فهرسة الجلسات خيارًا اختياريًا وتعمل بشكل غير متزامن. وقد تكون النتائج
قديمة قليلًا. وتوجد سجلات الجلسات على القرص، لذا تعامل مع الوصول إلى نظام
الملفات بوصفه حد الثقة.

---

## تسريع المتجهات في SQLite ‏(sqlite-vec)

| المفتاح                     | النوع     | الافتراضي | الوصف                                 |
| --------------------------- | --------- | --------- | ------------------------------------- |
| `store.vector.enabled`      | `boolean` | `true`    | استخدام sqlite-vec لاستعلامات المتجهات |
| `store.vector.extensionPath` | `string` | مضمّن     | تجاوز مسار sqlite-vec                 |

عندما لا يكون sqlite-vec متاحًا، يعود OpenClaw تلقائيًا إلى تشابه جيب
التمام داخل العملية.

## تخزين الفهرس

| المفتاح              | النوع    | الافتراضي                            | الوصف                                       |
| -------------------- | -------- | ------------------------------------ | ------------------------------------------- |
| `store.path`         | `string` | `~/.openclaw/memory/{agentId}.sqlite` | موقع الفهرس (يدعم الرمز `{agentId}`)       |
| `store.fts.tokenizer` | `string` | `unicode61`                          | محلل FTS5 ‏(`unicode61` أو `trigram`)       |

---

## تهيئة الواجهة الخلفية لـ QMD

اضبط `memory.backend = "qmd"` للتمكين. وتوجد جميع إعدادات QMD ضمن
`memory.qmd`:

| المفتاح                 | النوع     | الافتراضي | الوصف                                         |
| ----------------------- | --------- | --------- | --------------------------------------------- |
| `command`               | `string`  | `qmd`     | مسار الملف التنفيذي لـ QMD                    |
| `searchMode`            | `string`  | `search`  | أمر البحث: `search` أو `vsearch` أو `query`   |
| `includeDefaultMemory`  | `boolean` | `true`    | فهرسة تلقائية لـ `MEMORY.md` و`memory/**/*.md` |
| `paths[]`               | `array`   | --        | مسارات إضافية: `{ name, path, pattern? }`     |
| `sessions.enabled`      | `boolean` | `false`   | فهرسة نصوص الجلسات                            |
| `sessions.retentionDays` | `number` | --        | مدة الاحتفاظ بالنصوص                          |
| `sessions.exportDir`    | `string`  | --        | دليل التصدير                                  |

يفضّل OpenClaw أشكال مجموعات QMD الحالية وصيغ استعلام MCP، لكنه يحافظ
على عمل إصدارات QMD الأقدم من خلال الرجوع إلى علامات المجموعات القديمة
`--mask` وأسماء أدوات MCP الأقدم عند الحاجة.

تظل تجاوزات نماذج QMD على جانب QMD، وليس في تهيئة OpenClaw. وإذا كنت بحاجة إلى
تجاوز نماذج QMD على مستوى عام، فاضبط متغيرات البيئة مثل
`QMD_EMBED_MODEL` و`QMD_RERANK_MODEL` و`QMD_GENERATE_MODEL` في بيئة
تشغيل gateway.

### جدول التحديث

| المفتاح                  | النوع     | الافتراضي | الوصف                                  |
| ------------------------ | --------- | --------- | -------------------------------------- |
| `update.interval`        | `string`  | `5m`      | فترة التحديث                           |
| `update.debounceMs`      | `number`  | `15000`   | إزالة ارتداد تغييرات الملفات          |
| `update.onBoot`          | `boolean` | `true`    | التحديث عند بدء التشغيل                 |
| `update.waitForBootSync` | `boolean` | `false`   | حظر بدء التشغيل حتى يكتمل التحديث       |
| `update.embedInterval`   | `string`  | --        | وتيرة تضمين منفصلة                     |
| `update.commandTimeoutMs` | `number` | --        | المهلة الزمنية لأوامر QMD              |
| `update.updateTimeoutMs` | `number`  | --        | المهلة الزمنية لعمليات تحديث QMD       |
| `update.embedTimeoutMs`  | `number`  | --        | المهلة الزمنية لعمليات تضمين QMD       |

### الحدود

| المفتاح                  | النوع    | الافتراضي | الوصف                         |
| ------------------------ | -------- | --------- | ----------------------------- |
| `limits.maxResults`      | `number` | `6`       | الحد الأقصى لنتائج البحث      |
| `limits.maxSnippetChars` | `number` | --        | تقييد طول المقتطف             |
| `limits.maxInjectedChars` | `number` | --       | تقييد إجمالي الأحرف المحقونة  |
| `limits.timeoutMs`       | `number` | `4000`    | المهلة الزمنية للبحث          |

### النطاق

يتحكم في الجلسات التي يمكنها تلقي نتائج بحث QMD. ونفس المخطط المستخدم في
[`session.sendPolicy`](/ar/gateway/config-agents#session):

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

يسمح الإعداد الافتراضي المشحون بجلسات الرسائل المباشرة والقنوات، مع
الاستمرار في رفض المجموعات.

الافتراضي هو الرسائل المباشرة فقط. ويطابق `match.keyPrefix` مفتاح الجلسة
المطبّع؛ بينما يطابق `match.rawKeyPrefix` المفتاح الخام بما في ذلك `agent:<id>:`.

### الاستشهادات

ينطبق `memory.citations` على جميع الواجهات الخلفية:

| القيمة           | السلوك                                                |
| ---------------- | ----------------------------------------------------- |
| `auto` (الافتراضي) | تضمين تذييل `Source: <path#line>` في المقتطفات      |
| `on`             | تضمين التذييل دائمًا                                  |
| `off`            | حذف التذييل (مع استمرار تمرير المسار إلى الوكيل داخليًا) |

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

تُضبط Dreaming ضمن `plugins.entries.memory-core.config.dreaming`،
وليس ضمن `agents.defaults.memorySearch`.

تعمل Dreaming على شكل عملية مسح مجدولة واحدة، وتستخدم مراحل داخلية
light/deep/REM بوصفها تفصيلًا تنفيذيًا.

للاطلاع على السلوك المفاهيمي وأوامر الشرطة المائلة، راجع [Dreaming](/ar/concepts/dreaming).

### إعدادات المستخدم

| المفتاح     | النوع     | الافتراضي   | الوصف                                              |
| ----------- | --------- | ----------- | -------------------------------------------------- |
| `enabled`   | `boolean` | `false`     | تمكين Dreaming أو تعطيلها بالكامل                  |
| `frequency` | `string`  | `0 3 * * *` | وتيرة Cron اختيارية لعملية المسح الكاملة لـ Dreaming |

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

ملاحظات:

- تكتب Dreaming حالة الآلة إلى `memory/.dreams/`.
- تكتب Dreaming مخرجات سردية مقروءة للبشر إلى `DREAMS.md` (أو `dreams.md` الموجود).
- سياسة وعتبات مراحل light/deep/REM هي سلوك داخلي، وليست تهيئة موجهة للمستخدم.

## ذو صلة

- [نظرة عامة على الذاكرة](/ar/concepts/memory)
- [بحث الذاكرة](/ar/concepts/memory-search)
- [مرجع التهيئة](/ar/gateway/configuration-reference)
