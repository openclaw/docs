---
read_when:
    - تريد إعداد موفّري بحث الذاكرة أو نماذج التضمينات
    - تريد إعداد الواجهة الخلفية QMD
    - تريد ضبط البحث الهجين أو MMR أو التلاشي الزمني
    - تريد تفعيل فهرسة الذاكرة متعددة الوسائط
summary: جميع خيارات الإعداد لبحث الذاكرة، وموفّري التضمينات، وQMD، والبحث الهجين، والفهرسة متعددة الوسائط
title: مرجع إعداد الذاكرة
x-i18n:
    generated_at: "2026-04-15T14:41:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 334c3c4dac08e864487047d3822c75f96e9e7a97c38be4b4e0cd9e63c4489a53
    source_path: reference/memory-config.md
    workflow: 15
---

# مرجع إعداد الذاكرة

تسرد هذه الصفحة كل خيارات الإعداد الخاصة ببحث الذاكرة في OpenClaw. للحصول على
نظرات عامة مفاهيمية، راجع:

- [نظرة عامة على الذاكرة](/ar/concepts/memory) -- كيف تعمل الذاكرة
- [المحرّك المدمج](/ar/concepts/memory-builtin) -- الواجهة الخلفية الافتراضية لـ SQLite
- [محرّك QMD](/ar/concepts/memory-qmd) -- sidecar محلي أولًا
- [بحث الذاكرة](/ar/concepts/memory-search) -- مسار البحث والضبط
- [Active Memory](/ar/concepts/active-memory) -- تفعيل الوكيل الفرعي للذاكرة للجلسات التفاعلية

توجد جميع إعدادات بحث الذاكرة ضمن `agents.defaults.memorySearch` في
`openclaw.json` ما لم يُذكر خلاف ذلك.

إذا كنت تبحث عن مفتاح تفعيل ميزة **Active Memory** وإعداد الوكيل الفرعي،
فهو يوجد ضمن `plugins.entries.active-memory` بدلًا من `memorySearch`.

يستخدم Active Memory نموذج بوابتين:

1. يجب أن يكون Plugin مفعّلًا ويستهدف معرّف الوكيل الحالي
2. يجب أن يكون الطلب جلسة دردشة تفاعلية مستمرة مؤهلة

راجع [Active Memory](/ar/concepts/active-memory) لمعرفة نموذج التفعيل،
والإعداد المملوك للـ Plugin، واستمرارية النصوص، ونمط الطرح الآمن.

---

## اختيار الموفّر

| المفتاح   | النوع      | الافتراضي       | الوصف                                                                                                      |
| --------- | ---------- | --------------- | ---------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | يُكتشف تلقائيًا | معرّف مهايئ التضمينات: `bedrock` أو `gemini` أو `github-copilot` أو `local` أو `mistral` أو `ollama` أو `openai` أو `voyage` |
| `model`    | `string`  | افتراضي الموفّر | اسم نموذج التضمينات                                                                                        |
| `fallback` | `string`  | `"none"`        | معرّف المهايئ الاحتياطي عند فشل الأساسي                                                                     |
| `enabled`  | `boolean` | `true`          | تفعيل أو تعطيل بحث الذاكرة                                                                                 |

### ترتيب الاكتشاف التلقائي

عندما لا يتم تعيين `provider`، يختار OpenClaw أول خيار متاح:

1. `local` -- إذا كان `memorySearch.local.modelPath` مضبوطًا وكان الملف موجودًا.
2. `github-copilot` -- إذا أمكن حل رمز GitHub Copilot (متغير بيئة أو ملف تعريف مصادقة).
3. `openai` -- إذا أمكن حل مفتاح OpenAI.
4. `gemini` -- إذا أمكن حل مفتاح Gemini.
5. `voyage` -- إذا أمكن حل مفتاح Voyage.
6. `mistral` -- إذا أمكن حل مفتاح Mistral.
7. `bedrock` -- إذا نجحت سلسلة بيانات اعتماد AWS SDK (دور المثيل أو مفاتيح الوصول أو ملف التعريف أو SSO أو هوية الويب أو الإعداد المشترك).

`ollama` مدعوم لكنه لا يُكتشف تلقائيًا (عيّنه صراحةً).

### حل مفاتيح API

تتطلب التضمينات البعيدة مفتاح API. أما Bedrock فيستخدم سلسلة بيانات
الاعتماد الافتراضية لـ AWS SDK بدلًا من ذلك (أدوار المثيل وSSO ومفاتيح الوصول).

| الموفّر        | متغير البيئة                                        | مفتاح الإعداد                     |
| -------------- | --------------------------------------------------- | --------------------------------- |
| Bedrock        | سلسلة بيانات اعتماد AWS                            | لا حاجة إلى مفتاح API             |
| Gemini         | `GEMINI_API_KEY`                                    | `models.providers.google.apiKey`  |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN`  | ملف تعريف المصادقة عبر تسجيل دخول الجهاز |
| Mistral        | `MISTRAL_API_KEY`                                   | `models.providers.mistral.apiKey` |
| Ollama         | `OLLAMA_API_KEY` (عنصر نائب)                        | --                                |
| OpenAI         | `OPENAI_API_KEY`                                    | `models.providers.openai.apiKey`  |
| Voyage         | `VOYAGE_API_KEY`                                    | `models.providers.voyage.apiKey`  |

يغطي Codex OAuth الدردشة/الإكمالات فقط ولا يلبّي طلبات التضمينات.

---

## إعداد نقطة النهاية البعيدة

لنقاط نهاية OpenAI-compatible مخصّصة أو لتجاوز الإعدادات الافتراضية للموفّر:

| المفتاح            | النوع     | الوصف                                  |
| ------------------ | --------- | -------------------------------------- |
| `remote.baseUrl`   | `string`  | عنوان URL أساسي مخصّص للـ API          |
| `remote.apiKey`    | `string`  | تجاوز مفتاح API                        |
| `remote.headers`   | `object`  | رؤوس HTTP إضافية (تُدمج مع افتراضيات الموفّر) |

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

## إعداد Gemini الخاص

| المفتاح               | النوع     | الافتراضي             | الوصف                                      |
| --------------------- | --------- | --------------------- | ------------------------------------------ |
| `model`               | `string`  | `gemini-embedding-001` | يدعم أيضًا `gemini-embedding-2-preview`    |
| `outputDimensionality` | `number` | `3072`                | بالنسبة إلى Embedding 2: 768 أو 1536 أو 3072 |

<Warning>
يؤدي تغيير النموذج أو `outputDimensionality` إلى إعادة فهرسة كاملة تلقائيًا.
</Warning>

---

## إعداد تضمينات Bedrock

يستخدم Bedrock سلسلة بيانات الاعتماد الافتراضية لـ AWS SDK -- لا حاجة إلى مفاتيح API.
إذا كان OpenClaw يعمل على EC2 مع دور مثيل مفعّل لـ Bedrock، فما عليك سوى تعيين
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

| المفتاح               | النوع     | الافتراضي                     | الوصف                           |
| --------------------- | --------- | ----------------------------- | ------------------------------- |
| `model`               | `string`  | `amazon.titan-embed-text-v2:0` | أي معرّف نموذج تضمينات Bedrock |
| `outputDimensionality` | `number` | افتراضي النموذج               | بالنسبة إلى Titan V2: 256 أو 512 أو 1024 |

### النماذج المدعومة

النماذج التالية مدعومة (مع اكتشاف العائلة والقيم الافتراضية للأبعاد):

| معرّف النموذج                                | الموفّر     | الأبعاد الافتراضية | الأبعاد القابلة للإعداد |
| ------------------------------------------- | ----------- | ------------------ | ----------------------- |
| `amazon.titan-embed-text-v2:0`              | Amazon      | 1024               | 256، 512، 1024          |
| `amazon.titan-embed-text-v1`                | Amazon      | 1536               | --                      |
| `amazon.titan-embed-g1-text-02`             | Amazon      | 1536               | --                      |
| `amazon.titan-embed-image-v1`               | Amazon      | 1024               | --                      |
| `amazon.nova-2-multimodal-embeddings-v1:0`  | Amazon      | 1024               | 256، 384، 1024، 3072    |
| `cohere.embed-english-v3`                   | Cohere      | 1024               | --                      |
| `cohere.embed-multilingual-v3`              | Cohere      | 1024               | --                      |
| `cohere.embed-v4:0`                         | Cohere      | 1536               | 256-1536                |
| `twelvelabs.marengo-embed-3-0-v1:0`         | TwelveLabs  | 512                | --                      |
| `twelvelabs.marengo-embed-2-7-v1:0`         | TwelveLabs  | 1024               | --                      |

المتغيرات ذات لاحقة الإنتاجية (مثل `amazon.titan-embed-text-v1:2:8k`) ترث
إعدادات النموذج الأساسي.

### المصادقة

تستخدم مصادقة Bedrock ترتيب حل بيانات الاعتماد القياسي في AWS SDK:

1. متغيرات البيئة (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
2. ذاكرة التخزين المؤقت لرمز SSO
3. بيانات اعتماد رمز هوية الويب
4. ملفات بيانات الاعتماد والإعدادات المشتركة
5. بيانات اعتماد بيانات ECS أو EC2 الوصفية

تُحل المنطقة من `AWS_REGION` أو `AWS_DEFAULT_REGION` أو من
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

ولأقل قدر من الامتيازات، قصّر `InvokeModel` على النموذج المحدد:

```
arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
```

---

## إعداد التضمينات المحلية

| المفتاح               | النوع     | الافتراضي               | الوصف                          |
| --------------------- | --------- | ----------------------- | ------------------------------ |
| `local.modelPath`     | `string`  | يُنزّل تلقائيًا         | المسار إلى ملف نموذج GGUF      |
| `local.modelCacheDir` | `string`  | افتراضي node-llama-cpp | دليل التخزين المؤقت للنماذج المنزّلة |

النموذج الافتراضي: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 غيغابايت، يُنزّل تلقائيًا).
يتطلب بناءً أصليًا: `pnpm approve-builds` ثم `pnpm rebuild node-llama-cpp`.

---

## إعداد البحث الهجين

كلها ضمن `memorySearch.query.hybrid`:

| المفتاح               | النوع      | الافتراضي | الوصف                               |
| --------------------- | ---------- | --------- | ----------------------------------- |
| `enabled`             | `boolean`  | `true`    | تفعيل البحث الهجين BM25 + المتجهي   |
| `vectorWeight`        | `number`   | `0.7`     | وزن الدرجات المتجهية (0-1)          |
| `textWeight`          | `number`   | `0.3`     | وزن درجات BM25 (0-1)                |
| `candidateMultiplier` | `number`   | `4`       | مضاعِف حجم مجموعة المرشحين          |

### MMR (التنوع)

| المفتاح       | النوع      | الافتراضي | الوصف                               |
| ------------- | ---------- | --------- | ----------------------------------- |
| `mmr.enabled` | `boolean`  | `false`   | تفعيل إعادة الترتيب باستخدام MMR    |
| `mmr.lambda`  | `number`   | `0.7`     | 0 = أقصى تنوع، 1 = أقصى صلة         |

### التلاشي الزمني (الحداثة)

| المفتاح                     | النوع      | الافتراضي | الوصف                      |
| --------------------------- | ---------- | --------- | -------------------------- |
| `temporalDecay.enabled`     | `boolean`  | `false`   | تفعيل تعزيز الحداثة        |
| `temporalDecay.halfLifeDays` | `number`  | `30`      | تنخفض الدرجة إلى النصف كل N يومًا |

لا يُطبّق التلاشي أبدًا على الملفات الدائمة (`MEMORY.md` والملفات غير المؤرخة في `memory/`).

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

| المفتاح     | النوع       | الوصف                                 |
| ----------- | ----------- | ------------------------------------- |
| `extraPaths` | `string[]` | أدلة أو ملفات إضافية للفهرسة          |

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

يمكن أن تكون المسارات مطلقة أو نسبةً إلى مساحة العمل. تُفحص الأدلة
بشكل تكراري بحثًا عن ملفات `.md`. يعتمد التعامل مع الروابط الرمزية على الواجهة الخلفية النشطة:
فالمحرّك المدمج يتجاهل الروابط الرمزية، بينما يتبع QMD سلوك الماسح الضوئي الأساسي في QMD.

للبحث في نصوص الوكلاء الآخرين ضمن نطاق الوكيل، استخدم
`agents.list[].memorySearch.qmd.extraCollections` بدلًا من `memory.qmd.paths`.
تتبع تلك المجموعات الإضافية الشكل نفسه `{ path, name, pattern? }`، لكنها
تُدمج لكل وكيل ويمكنها الحفاظ على الأسماء المشتركة الصريحة عندما يشير المسار
إلى خارج مساحة العمل الحالية.
إذا ظهر نفس المسار المحلول في كلٍّ من `memory.qmd.paths` و
`memorySearch.qmd.extraCollections`، فسيحتفظ QMD بالإدخال الأول ويتخطى
المكرر.

---

## الذاكرة متعددة الوسائط (Gemini)

افهرس الصور والملفات الصوتية إلى جانب Markdown باستخدام Gemini Embedding 2:

| المفتاح                    | النوع       | الافتراضي | الوصف                                 |
| ------------------------- | ---------- | ---------- | ------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | تفعيل الفهرسة متعددة الوسائط           |
| `multimodal.modalities`   | `string[]` | --         | `["image"]` أو `["audio"]` أو `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | الحد الأقصى لحجم الملف للفهرسة         |

ينطبق هذا فقط على الملفات الموجودة في `extraPaths`. تظل جذور الذاكرة الافتراضية مقتصرة على Markdown.
يتطلب `gemini-embedding-2-preview`. ويجب أن تكون قيمة `fallback` هي `"none"`.

التنسيقات المدعومة: `.jpg` و`.jpeg` و`.png` و`.webp` و`.gif` و`.heic` و`.heif`
(صور)؛ و`.mp3` و`.wav` و`.ogg` و`.opus` و`.m4a` و`.aac` و`.flac` (صوت).

---

## ذاكرة التخزين المؤقت للتضمينات

| المفتاح           | النوع      | الافتراضي | الوصف                              |
| ----------------- | --------- | --------- | ---------------------------------- |
| `cache.enabled`   | `boolean` | `false`   | تخزين تضمينات الأجزاء مؤقتًا في SQLite |
| `cache.maxEntries` | `number` | `50000`   | الحد الأقصى للتضمينات المخزنة مؤقتًا |

يمنع إعادة إنشاء التضمينات للنص غير المتغير أثناء إعادة الفهرسة أو تحديثات النصوص.

---

## الفهرسة على دفعات

| المفتاح                      | النوع      | الافتراضي | الوصف                     |
| ---------------------------- | --------- | --------- | ------------------------- |
| `remote.batch.enabled`        | `boolean` | `false`   | تفعيل API التضمينات على دفعات |
| `remote.batch.concurrency`    | `number`  | `2`       | مهام دفعات متوازية        |
| `remote.batch.wait`           | `boolean` | `true`    | انتظار اكتمال الدفعة      |
| `remote.batch.pollIntervalMs` | `number`  | --        | فترة الاستطلاع            |
| `remote.batch.timeoutMinutes` | `number`  | --        | مهلة الدفعة               |

متاح مع `openai` و`gemini` و`voyage`. وعادةً ما تكون دفعات OpenAI
الأسرع والأقل تكلفة لعمليات التعبئة الكبيرة.

---

## بحث ذاكرة الجلسة (تجريبي)

افهرس نصوص الجلسات وأظهرها عبر `memory_search`:

| المفتاح                      | النوع       | الافتراضي    | الوصف                                  |
| ---------------------------- | ---------- | ------------ | -------------------------------------- |
| `experimental.sessionMemory` | `boolean`  | `false`      | تفعيل فهرسة الجلسات                    |
| `sources`                    | `string[]` | `["memory"]` | أضف `"sessions"` لتضمين النصوص         |
| `sync.sessions.deltaBytes`   | `number`   | `100000`     | عتبة البايتات لإعادة الفهرسة           |
| `sync.sessions.deltaMessages` | `number`  | `50`         | عتبة الرسائل لإعادة الفهرسة            |

فهرسة الجلسات اختيارية وتعمل بشكل غير متزامن. وقد تكون النتائج قديمة قليلًا.
توجد سجلات الجلسات على القرص، لذا تعامل مع الوصول إلى نظام الملفات بوصفه
حدود الثقة.

---

## تسريع المتجهات في SQLite ‏(sqlite-vec)

| المفتاح                     | النوع      | الافتراضي | الوصف                              |
| --------------------------- | --------- | --------- | ---------------------------------- |
| `store.vector.enabled`      | `boolean` | `true`    | استخدام sqlite-vec لاستعلامات المتجهات |
| `store.vector.extensionPath` | `string` | bundled   | تجاوز مسار sqlite-vec              |

عندما لا يكون sqlite-vec متاحًا، يعود OpenClaw تلقائيًا إلى
تشابه جيب التمام داخل العملية.

---

## تخزين الفهرس

| المفتاح              | النوع     | الافتراضي                              | الوصف                                    |
| -------------------- | -------- | -------------------------------------- | ---------------------------------------- |
| `store.path`         | `string` | `~/.openclaw/memory/{agentId}.sqlite`  | موقع الفهرس (يدعم الرمز `{agentId}`)     |
| `store.fts.tokenizer` | `string` | `unicode61`                            | محلّل FTS5 (`unicode61` أو `trigram`)    |

---

## إعداد الواجهة الخلفية QMD

عيّن `memory.backend = "qmd"` للتفعيل. توجد جميع إعدادات QMD ضمن
`memory.qmd`:

| المفتاح                 | النوع      | الافتراضي | الوصف                                         |
| ----------------------- | --------- | --------- | --------------------------------------------- |
| `command`               | `string`  | `qmd`     | مسار الملف التنفيذي لـ QMD                    |
| `searchMode`            | `string`  | `search`  | أمر البحث: `search` أو `vsearch` أو `query`   |
| `includeDefaultMemory`  | `boolean` | `true`    | فهرسة `MEMORY.md` و`memory/**/*.md` تلقائيًا  |
| `paths[]`               | `array`   | --        | مسارات إضافية: `{ name, path, pattern? }`     |
| `sessions.enabled`      | `boolean` | `false`   | فهرسة نصوص الجلسات                            |
| `sessions.retentionDays` | `number` | --        | مدة الاحتفاظ بالنصوص                          |
| `sessions.exportDir`    | `string`  | --        | دليل التصدير                                  |

يفضّل OpenClaw أشكال مجموعة QMD الحالية واستعلامات MCP، لكنه يُبقي
إصدارات QMD الأقدم عاملة من خلال الرجوع إلى أعلام مجموعات `--mask` القديمة
وأسماء أدوات MCP الأقدم عند الحاجة.

تبقى تجاوزات نموذج QMD ضمن جهة QMD، وليس في إعداد OpenClaw. إذا احتجت إلى
تجاوز نماذج QMD على مستوى عام، فاضبط متغيرات البيئة مثل
`QMD_EMBED_MODEL` و`QMD_RERANK_MODEL` و`QMD_GENERATE_MODEL` في
بيئة تشغيل Gateway.

### جدول التحديث

| المفتاح                  | النوع      | الافتراضي | الوصف                              |
| ------------------------ | --------- | --------- | ---------------------------------- |
| `update.interval`        | `string`  | `5m`      | فترة التحديث                       |
| `update.debounceMs`      | `number`  | `15000`   | تأخير إزالة الاهتزاز لتغييرات الملفات |
| `update.onBoot`          | `boolean` | `true`    | التحديث عند بدء التشغيل            |
| `update.waitForBootSync` | `boolean` | `false`   | حظر بدء التشغيل حتى يكتمل التحديث   |
| `update.embedInterval`   | `string`  | --        | وتيرة تضمين منفصلة                 |
| `update.commandTimeoutMs` | `number` | --        | مهلة أوامر QMD                     |
| `update.updateTimeoutMs` | `number`  | --        | مهلة عمليات تحديث QMD              |
| `update.embedTimeoutMs`  | `number`  | --        | مهلة عمليات التضمين في QMD         |

### الحدود

| المفتاح                  | النوع     | الافتراضي | الوصف                         |
| ------------------------ | -------- | --------- | ----------------------------- |
| `limits.maxResults`      | `number` | `6`       | الحد الأقصى لنتائج البحث      |
| `limits.maxSnippetChars` | `number` | --        | تقييد طول المقتطف             |
| `limits.maxInjectedChars` | `number` | --       | تقييد إجمالي الأحرف المدرجة   |
| `limits.timeoutMs`       | `number` | `4000`    | مهلة البحث                    |

### النطاق

يتحكم في الجلسات التي يمكنها تلقي نتائج بحث QMD. وهو بنفس مخطط
[`session.sendPolicy`](/ar/gateway/configuration-reference#session):

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

يسمح الإعداد الافتراضي المرفق بجلسات الرسائل المباشرة والقنوات، مع الاستمرار
في رفض المجموعات.

الافتراضي هو الرسائل المباشرة فقط. يطابق `match.keyPrefix` مفتاح الجلسة المطبّع؛
ويطابق `match.rawKeyPrefix` المفتاح الخام بما في ذلك `agent:<id>:`.

### الاستشهادات

ينطبق `memory.citations` على جميع الواجهات الخلفية:

| القيمة            | السلوك                                                |
| ---------------- | ----------------------------------------------------- |
| `auto` (الافتراضي) | تضمين تذييل `Source: <path#line>` في المقتطفات       |
| `on`             | تضمين التذييل دائمًا                                  |
| `off`            | حذف التذييل (لا يزال المسار يُمرر إلى الوكيل داخليًا) |

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

يُضبط Dreaming ضمن `plugins.entries.memory-core.config.dreaming`،
وليس ضمن `agents.defaults.memorySearch`.

يعمل Dreaming كعملية مسح مجدولة واحدة ويستخدم مراحل light/deep/REM الداخلية
بوصفها تفصيلًا تنفيذيًا.

للاطلاع على السلوك المفاهيمي وأوامر الشرطة المائلة، راجع [Dreaming](/ar/concepts/dreaming).

### إعدادات المستخدم

| المفتاح    | النوع      | الافتراضي   | الوصف                                         |
| ---------- | --------- | ----------- | --------------------------------------------- |
| `enabled`  | `boolean` | `false`     | تفعيل Dreaming أو تعطيله بالكامل              |
| `frequency` | `string` | `0 3 * * *` | وتيرة Cron اختيارية لعملية Dreaming الكاملة   |

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

- يكتب Dreaming حالة الآلة إلى `memory/.dreams/`.
- يكتب Dreaming مخرجات سردية مقروءة للبشر إلى `DREAMS.md` (أو `dreams.md` الموجود).
- إن سياسة المراحل light/deep/REM والعتبات هي سلوك داخلي، وليست إعدادًا موجّهًا للمستخدم.
