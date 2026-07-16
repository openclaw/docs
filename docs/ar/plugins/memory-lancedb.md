---
read_when:
    - أنت تقوم بتهيئة Plugin ‏memory-lancedb
    - تريد ذاكرة طويلة الأمد مدعومة بـ LanceDB مع الاسترجاع التلقائي أو الالتقاط التلقائي
    - أنت تستخدم تضمينات محلية متوافقة مع OpenAI مثل Ollama
sidebarTitle: Memory LanceDB
summary: هيّئ Plugin الذاكرة الخارجي الرسمي LanceDB، بما في ذلك التضمينات المحلية المتوافقة مع Ollama
title: ذاكرة LanceDB
x-i18n:
    generated_at: "2026-07-16T14:27:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 786b511da4fbfd90f4c3e5be5a1aeddf5daa59036247552bd671f4bab89319f6
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` هو plugin خارجي رسمي يخزّن الذاكرة طويلة الأمد في
LanceDB مع البحث المتجهي. ويمكنه الاستدعاء التلقائي للذكريات ذات الصلة قبل دور
النموذج والتقاط الحقائق المهمة تلقائيًا بعد الاستجابة.

استخدمه لقاعدة بيانات متجهية محلية، أو نقطة نهاية تضمين متوافقة مع OpenAI، أو
مخزن ذاكرة خارج الواجهة الخلفية الافتراضية المضمنة للذاكرة.

## التثبيت

```bash
openclaw plugins install @openclaw/memory-lancedb
```

يُنشر الـ plugin على npm؛ ولا يكون مضمنًا في صورة وقت تشغيل OpenClaw.
تؤدي تهيئته إلى كتابة إدخال الـ plugin وتمكينه وتحويل
`plugins.slots.memory` إلى `memory-lancedb`. إذا كان plugin آخر يشغل
حاليًا خانة الذاكرة، فسيُعطّل ذلك الـ plugin مع إصدار تحذير.

<Note>
يمكن تشغيل plugins مصاحبة مثل `memory-wiki` إلى جانب `memory-lancedb`،
لكن لا يشغل خانة الذاكرة النشطة في الوقت نفسه سوى plugin واحد.
</Note>

## البدء السريع

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "openai",
            model: "text-embedding-3-small",
          },
          autoRecall: true,
          autoCapture: false,
        },
      },
    },
  },
}
```

أعد تشغيل Gateway بعد تغيير إعدادات الـ plugin، ثم تحقق من تحميله:

```bash
openclaw gateway restart
openclaw plugins list
```

## إعدادات التضمين

`embedding` مطلوب ويجب أن يتضمن حقلاً واحدًا على الأقل. القيمة الافتراضية لـ `provider`
هي `openai`؛ والقيمة الافتراضية لـ `model` هي `text-embedding-3-small`.

| الحقل                  | النوع          | ملاحظات                                                                    |
| ---------------------- | ------------- | ------------------------------------------------------------------------ |
| `embedding.provider`   | سلسلة نصية        | معرّف المهايئ، مثل `openai` و`github-copilot` و`ollama`. القيمة الافتراضية `openai`. |
| `embedding.model`      | سلسلة نصية        | القيمة الافتراضية `text-embedding-3-small`.                                        |
| `embedding.apiKey`     | سلسلة نصية        | اختياري؛ يدعم توسيع `${ENV_VAR}`.                               |
| `embedding.baseUrl`    | سلسلة نصية        | اختياري؛ يدعم توسيع `${ENV_VAR}`.                               |
| `embedding.dimensions` | عدد صحيح (>=1) | مطلوب للنماذج غير الموجودة في الجدول المضمن (انظر أدناه).               |

يوجد مساران للطلبات:

- **مسار مهايئ المزوّد** (الافتراضي): عيّن `embedding.provider` واترك
  `embedding.apiKey`/`embedding.baseUrl`. يحل الـ plugin ملف تعريف المصادقة
  المضبوط للمزوّد أو متغير البيئة أو
  `models.providers.<provider>.apiKey` عبر مهايئات تضمين الذاكرة نفسها
  التي يستخدمها `memory-core`. هذا هو المسار المخصص لـ `github-copilot` و`ollama`
  وأي مزوّد مضمن آخر يدعم التضمين.
- **مسار العميل المباشر المتوافق مع OpenAI**: اترك `embedding.provider` بلا تعيين
  (أو `"openai"`) وعيّن `embedding.apiKey` مع `embedding.baseUrl`. استخدم هذا
  لنقطة نهاية تضمينات أولية متوافقة مع OpenAI لا تمتلك مهايئ مزوّد
  مضمنًا.

مصادقة OAuth الخاصة بـ OpenAI Codex / ChatGPT ليست بيانات اعتماد تضمينات لمنصة OpenAI.
لاستخدام تضمينات OpenAI، استخدم ملف تعريف مصادقة بمفتاح OpenAI API، أو `OPENAI_API_KEY`، أو
`models.providers.openai.apiKey`. ينبغي للمستخدمين الذين لا يملكون سوى OAuth اختيار مزوّد آخر
يدعم التضمين مثل `github-copilot` أو `ollama`.

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "github-copilot",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

ترفض بعض نقاط نهاية التضمين المتوافقة مع OpenAI المعامل `encoding_format`؛
بينما تتجاهله نقاط أخرى وتعيد دائمًا `number[]`. يحذف `memory-lancedb`
المعامل `encoding_format` من الطلبات ويقبل استجابات إما على هيئة مصفوفة أعداد عشرية أو
أعداد float32 مرمّزة بـ base64، لذا يعمل كلا شكلي الاستجابة دون إعدادات.

### الأبعاد

يتضمن OpenClaw بُعدًا مضمنًا لـ `text-embedding-3-small` (1536) و
`text-embedding-3-large` (3072) فقط. يحتاج أي نموذج آخر إلى قيمة صريحة لـ
`embedding.dimensions` كي يتمكن LanceDB من إنشاء العمود المتجهي، مثل
ZhiPu `embedding-3` بأبعاد تبلغ 2048:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            apiKey: "${ZHIPU_API_KEY}",
            baseUrl: "https://open.bigmodel.cn/api/paas/v4",
            model: "embedding-3",
            dimensions: 2048,
          },
        },
      },
    },
  },
}
```

## تضمينات Ollama

استخدم مسار مهايئ مزوّد Ollama المضمن (`embedding.provider: "ollama"`).
يستدعي نقطة النهاية الأصلية `/api/embed` في Ollama ويتبع قواعد المصادقة/عنوان URL الأساسي
نفسها التي يتبعها مزوّد [Ollama](/ar/providers/ollama).

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "ollama",
            baseUrl: "http://127.0.0.1:11434",
            model: "mxbai-embed-large",
            dimensions: 1024,
          },
          recallMaxChars: 400,
          autoRecall: true,
          autoCapture: false,
        },
      },
    },
  },
}
```

`mxbai-embed-large` غير موجود في جدول الأبعاد المضمن، لذا فإن `dimensions`
مطلوب. بالنسبة إلى نماذج التضمين المحلية الصغيرة، اخفض `recallMaxChars` إذا أعاد
الخادم المحلي أخطاء طول السياق.

## حدود الاستدعاء والالتقاط

| الإعداد           | القيمة الافتراضية | النطاق                        | ينطبق على                                                 |
| ----------------- | ------- | ---------------------------- | ---------------------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000                    | النص المرسل إلى واجهة API للتضمين بغرض الاستدعاء.                 |
| `captureMaxChars` | `500`   | 100-10000                    | طول الرسالة المؤهلة للالتقاط التلقائي.                  |
| `customTriggers`  | `[]`    | 0-50 عنصرًا، كل منها <=100 حرف | عبارات حرفية تجعل الالتقاط التلقائي يضع الرسالة في الاعتبار. |

يحد `recallMaxChars` من استعلام الاستدعاء التلقائي `before_prompt_build`،
وأداة `memory_recall`، ومسار استعلام `memory_forget`، و`openclaw ltm
search`. يضمّن الاستدعاء التلقائي أحدث رسالة للمستخدم من الدور، ولا
يلجأ إلى المطالبة الكاملة إلا عند عدم وجود رسالة مستخدم، مما يُبقي بيانات
القناة الوصفية وكتل المطالبات الكبيرة خارج طلب التضمين.

يتحكم `captureMaxChars` في ما إذا كانت رسالة المستخدم من حدث `agent_end`
الخاص بالدور قصيرة بما يكفي للنظر فيها من أجل الالتقاط التلقائي؛ ولا يؤثر في
استعلامات الاستدعاء.

يضيف `customTriggers` عبارات حرفية للالتقاط التلقائي دون تعبيرات نمطية. تغطي
المحفزات المضمنة عبارات الذاكرة الشائعة بالإنجليزية والتشيكية والصينية واليابانية والكورية
(`remember` و`prefer` و`记住` و`覚えて` و`기억해` وما شابهها).

يرفض الالتقاط التلقائي أيضًا النص الذي يبدو كبيانات وصفية للمغلف/النقل،
أو حمولات حقن المطالبات، أو سياق `<relevant-memories>` المحقون بالفعل،
ويضع حدًا أقصى قدره 3 ذكريات ملتقطة لكل دور وكيل.

تكون كل ذاكرة مملوكة لوكيل واحد. يفرض الاستدعاء واكتشاف التكرارات والالتقاط
والسرد والاستعلامات الأولية والحذف جميعها ذلك المالك قبل إرجاع الصفوف أو
تعديلها. كما أن الوكيل الذي لديه `memorySearch.enabled: false` (في `agents.list[]`
أو عبر `agents.defaults`) لا يحصل على أي من أدوات `memory_recall` أو `memory_store`
أو `memory_forget`، ولا يشارك في الاستدعاء أو الالتقاط التلقائيين،
حتى عندما تكون علامتا `autoRecall`/`autoCapture` على مستوى الـ plugin مفعّلتين.

## الأوامر

يسجّل `memory-lancedb` نطاق CLI المسمى `ltm` متى كان مثبتًا
(وليس فقط عندما يشغل خانة الذاكرة النشطة):

```bash
openclaw ltm list [--agent <id>] [--limit <n>] [--order-by-created-at]
openclaw ltm search <query> [--agent <id>] [--limit <n>]
openclaw ltm stats [--agent <id>]
```

يشغّل `ltm query` استعلامًا غير متجهي مباشرة على جدول LanceDB:

```bash
openclaw ltm query --agent research --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

| العلامة                              | القيمة الافتراضية                                 | ملاحظات                                                                                                                                     |
| --------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--agent <id>`                    | الوكيل الافتراضي المضبوط                | يحدد نطاق الوكيل الخاص. متاح في `list` و`search` و`query` و`stats`.                                                 |
| `--cols <columns>`                | `id,text,importance,category,createdAt` | قائمة سماح بالأعمدة مفصولة بفواصل.                                                                                                         |
| `--filter <condition>`            | لا شيء                                    | مقارنة واحدة على عمود إخراج، مثل `category = 'preference'` أو `importance >= 0.8`. يجب وضع قيم السلاسل النصية بين علامتي اقتباس.             |
| `--limit <n>`                     | `10`                                    | عدد صحيح موجب.                                                                                                                         |
| `--order-by <column>:<asc\|desc>` | لا شيء                                    | يُرتّب في الذاكرة بعد تشغيل عامل التصفية؛ ويُضاف عمود الترتيب تلقائيًا إلى الإسقاط ويُحذف من المخرجات إذا لم يكن مطلوبًا. |

يحصل الوكلاء على ثلاث أدوات من plugin الذاكرة النشط:

- `memory_recall`: بحث متجهي في الذكريات المخزنة.
- `memory_store`: يحفظ حقيقة أو تفضيلاً أو قرارًا أو كيانًا (يرفض النص
  الذي يبدو كحمولة حقن مطالبة؛ ويتخطى التخزين شبه المكرر).
- `memory_forget`: يحذف حسب `memoryId`، أو حسب `query` (يحذف تلقائيًا تطابقًا واحدًا
  تتجاوز درجته 90%، وإلا يسرد المعرّفات المرشحة لإزالة الالتباس).

## التخزين

تُخزّن بيانات LanceDB افتراضيًا في `~/.openclaw/memory/lancedb`. تجاوز ذلك باستخدام `dbPath`:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          dbPath: "~/.openclaw/memory/lancedb",
          embedding: {
            apiKey: "${OPENAI_API_KEY}",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

يحتفظ الـ plugin بجدول LanceDB واحد ويخزّن مالك وكيل موحّدًا في كل
صف. هذا حد تخزين، وليس عامل تصفية بعد البحث: تُطبّق ملكية الوكيل
قبل ترتيب المتجهات وتُضمّن في شروط السرد والاستعلام والعد والحذف.
يقبل `ltm query --filter` مقارنة واحدة متحققًا من صحتها على أعمدة
الإخراج العامة. ينشئ المخزن تلك المقارنة بصورة منفصلة عن شرط
المالك الإلزامي، ولذلك لا يمكن لعامل تصفية توسيع الاستعلام ليشمل وكيلاً
آخر.

لا تحتوي قواعد البيانات المنشأة قبل تطبيق الملكية لكل وكيل على مصدر موثوق للصفوف.
عند الترقية، يعيّن `openclaw doctor --fix` تلك الصفوف القديمة مرة واحدة إلى
الوكيل الافتراضي المضبوط. يفشل الوصول في وقت التشغيل بصورة مغلقة حتى
اكتمال ذلك الترحيل؛ ولا ترث الوكلاء الأخرى الصفوف المشتركة القديمة مطلقًا.

يقبل `storageOptions` أزواج مفاتيح/قيم نصية للواجهات الخلفية لتخزين LanceDB
(مثل تخزين الكائنات المتوافق مع S3) ويدعم توسيع `${ENV_VAR}`:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          dbPath: "s3://memory-bucket/openclaw",
          storageOptions: {
            access_key: "${AWS_ACCESS_KEY_ID}",
            secret_key: "${AWS_SECRET_ACCESS_KEY}",
            endpoint: "${AWS_ENDPOINT_URL}",
          },
          embedding: {
            apiKey: "${OPENAI_API_KEY}",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

## تبعيات وقت التشغيل ودعم المنصات

يعتمد `memory-lancedb` على حزمة `@lancedb/lancedb` الأصلية، التي تملكها
حزمة Plugin (وليست توزيعة OpenClaw الأساسية). لا يُصلح بدء تشغيل Gateway
تبعيات Plugin؛ إذا كانت التبعية الأصلية مفقودة أو تعذّر تحميلها،
فأعد تثبيت حزمة Plugin أو حدّثها، ثم أعد تشغيل Gateway.

لا ينشر `@lancedb/lancedb` إصدارًا أصليًا لـ `darwin-x64` (جهاز Mac بمعالج
Intel). على هذه المنصة، يسجل Plugin عند التحميل أن LanceDB غير متاح؛
استخدم واجهة الذاكرة الخلفية الافتراضية، أو شغّل Gateway على
منصة/معمارية مدعومة، أو عطّل `memory-lancedb`.

## استكشاف الأخطاء وإصلاحها

### يتجاوز طول الإدخال طول السياق

رفض نموذج التضمين استعلام الاسترجاع:

```text
memory-lancedb: فشل الاسترجاع: خطأ: 400 يتجاوز طول الإدخال طول السياق
```

خفّض `recallMaxChars`، ثم أعد تشغيل Gateway:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        config: {
          recallMaxChars: 400,
        },
      },
    },
  },
}
```

بالنسبة إلى Ollama، تحقّق أيضًا من إمكانية الوصول إلى خادم التضمين من مضيف Gateway
باستخدام نقطة نهاية التضمين الأصلية الخاصة به:

```bash
curl http://127.0.0.1:11434/api/embed \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"مرحبًا"}'
```

### نموذج تضمين غير مدعوم

من دون `embedding.dimensions`، لا تُعرف سوى أبعاد تضمين OpenAI المضمّنة
(`text-embedding-3-small`، `text-embedding-3-large`). لأي نموذج آخر،
اضبط `embedding.dimensions` على حجم المتجه الذي يبلّغ عنه ذلك النموذج.

### يُحمّل Plugin ولكن لا تظهر أي ذكريات

تأكّد من أن `plugins.slots.memory` يشير إلى `memory-lancedb`، ثم شغّل:

```bash
openclaw ltm stats
openclaw ltm search "تفضيل حديث"
```

إذا كان `autoCapture` معطّلًا، فسيظل Plugin يسترجع الذكريات الموجودة، لكنه
لا يخزّن الذكريات الجديدة تلقائيًا. استخدم أداة `memory_store`، أو فعّل
`autoCapture`.

## ذو صلة

- [نظرة عامة على الذاكرة](/ar/concepts/memory)
- [Active Memory](/ar/concepts/active-memory)
- [البحث في الذاكرة](/ar/concepts/memory-search)
- [ويكي الذاكرة](/ar/plugins/memory-wiki)
- [Ollama](/ar/providers/ollama)
