---
read_when:
    - أنت تُعِدّ Plugin ‏memory-lancedb
    - تريد ذاكرة طويلة الأمد مدعومة بـ LanceDB مع الاستدعاء التلقائي أو الالتقاط التلقائي
    - أنت تستخدم تضمينات محلية متوافقة مع OpenAI مثل Ollama
sidebarTitle: Memory LanceDB
summary: تهيئة Plugin الذاكرة الخارجي الرسمي LanceDB، بما في ذلك التضمينات المحلية المتوافقة مع Ollama
title: ذاكرة LanceDB
x-i18n:
    generated_at: "2026-07-12T06:12:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cdcf5ef7b7fbb8bf6055363d86782cfa36df193fc724406dba06c1380fd9f434
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` هو Plugin خارجي رسمي يخزّن الذاكرة طويلة الأمد في
LanceDB مع البحث المتجهي. ويمكنه استدعاء الذكريات ذات الصلة تلقائيًا قبل دور
النموذج والتقاط الحقائق المهمة تلقائيًا بعد الاستجابة.

استخدمه لقاعدة بيانات متجهية محلية، أو نقطة نهاية للتضمينات متوافقة مع OpenAI، أو
مخزن ذاكرة خارج الواجهة الخلفية الافتراضية المضمنة للذاكرة.

## التثبيت

```bash
openclaw plugins install @openclaw/memory-lancedb
```

يُنشر Plugin على npm؛ ولا يكون مضمّنًا في صورة بيئة تشغيل OpenClaw.
تؤدي عملية تثبيته إلى كتابة إدخال Plugin وتمكينه وتبديل
`plugins.slots.memory` إلى `memory-lancedb`. إذا كان Plugin آخر يشغل حاليًا
فتحة الذاكرة، فسيُعطّل ذلك Plugin مع عرض تحذير.

<Note>
يمكن أن تعمل Plugins المصاحبة مثل `memory-wiki` بجانب `memory-lancedb`،
لكن لا يمكن إلا لـ Plugin واحد شغل فتحة الذاكرة النشطة في كل مرة.
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

أعد تشغيل Gateway بعد تغيير إعدادات Plugin، ثم تحقق من تحميله:

```bash
openclaw gateway restart
openclaw plugins list
```

## إعدادات التضمين

`embedding` مطلوب ويجب أن يتضمن حقلاً واحدًا على الأقل. القيمة الافتراضية لـ
`provider` هي `openai`، والقيمة الافتراضية لـ `model` هي `text-embedding-3-small`.

| الحقل                  | النوع          | ملاحظات                                                                    |
| ---------------------- | ------------- | ------------------------------------------------------------------------ |
| `embedding.provider`   | سلسلة نصية        | معرّف المهايئ، مثل `openai` و`github-copilot` و`ollama`. القيمة الافتراضية `openai`. |
| `embedding.model`      | سلسلة نصية        | القيمة الافتراضية `text-embedding-3-small`.                                        |
| `embedding.apiKey`     | سلسلة نصية        | اختياري؛ يدعم توسيع `${ENV_VAR}`.                               |
| `embedding.baseUrl`    | سلسلة نصية        | اختياري؛ يدعم توسيع `${ENV_VAR}`.                               |
| `embedding.dimensions` | عدد صحيح (>=1) | مطلوب للنماذج غير الموجودة في الجدول المضمن (انظر أدناه).               |

يوجد مساران للطلبات:

- **مسار مهايئ المزوّد** (الافتراضي): عيّن `embedding.provider` واترك
  `embedding.apiKey`/`embedding.baseUrl` دون تعيين. يحل Plugin ملف تعريف
  المصادقة المُعدّ للمزوّد، أو متغير البيئة، أو
  `models.providers.<provider>.apiKey` من خلال مهايئات تضمين الذاكرة نفسها
  التي يستخدمها `memory-core`. هذا هو المسار الخاص بـ `github-copilot` و`ollama`
  وأي مزوّد مضمّن آخر يدعم التضمينات.
- **مسار العميل المباشر المتوافق مع OpenAI**: اترك `embedding.provider` دون تعيين
  (أو عيّنه إلى `"openai"`) وعيّن `embedding.apiKey` مع `embedding.baseUrl`. استخدم هذا
  لنقطة نهاية تضمينات أولية متوافقة مع OpenAI لا يتوفر لها مهايئ مزوّد
  مضمّن.

لا تُعد OAuth الخاصة بـ OpenAI Codex / ChatGPT بيانات اعتماد لتضمينات منصة OpenAI.
لاستخدام تضمينات OpenAI، استخدم ملف تعريف مصادقة بمفتاح OpenAI API، أو `OPENAI_API_KEY`، أو
`models.providers.openai.apiKey`. ينبغي للمستخدمين الذين لا يملكون إلا OAuth اختيار مزوّد آخر
يدعم التضمينات، مثل `github-copilot` أو `ollama`.

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

ترفض بعض نقاط نهاية التضمينات المتوافقة مع OpenAI المعلمة `encoding_format`؛
بينما تتجاهلها نقاط أخرى وتعيد دائمًا `number[]`. يحذف `memory-lancedb`
المعلمة `encoding_format` من الطلبات ويقبل استجابات إما على شكل مصفوفة أعداد عشرية أو
قيم float32 مرمّزة بـ base64، ولذلك يعمل شكلا الاستجابة دون إعدادات إضافية.

### الأبعاد

يتضمن OpenClaw أبعادًا مضمنة فقط لـ `text-embedding-3-small`‏ (1536) و
`text-embedding-3-large`‏ (3072). يحتاج أي نموذج آخر إلى قيمة صريحة لـ
`embedding.dimensions` حتى يتمكن LanceDB من إنشاء عمود المتجهات، مثل
نموذج ZhiPu‏ `embedding-3` ذي 2048 بُعدًا:

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

استخدم مسار مهايئ مزوّد Ollama المضمّن (`embedding.provider: "ollama"`).
يستدعي هذا المسار نقطة النهاية الأصلية `/api/embed` في Ollama ويتبع قواعد المصادقة/عنوان URL
الأساسي نفسها الخاصة بمزوّد [Ollama](/ar/providers/ollama).

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

لا يوجد `mxbai-embed-large` في جدول الأبعاد المضمن، لذا تكون `dimensions`
مطلوبة. بالنسبة إلى نماذج التضمين المحلية الصغيرة، اخفض `recallMaxChars` إذا أعاد
الخادم المحلي أخطاء طول السياق.

## حدود الاستدعاء والالتقاط

| الإعداد           | القيمة الافتراضية | النطاق                        | ينطبق على                                                 |
| ----------------- | ------- | ---------------------------- | ---------------------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000                    | النص المرسل إلى API التضمين للاستدعاء.                 |
| `captureMaxChars` | `500`   | 100-10000                    | طول الرسالة المؤهلة للالتقاط التلقائي.                  |
| `customTriggers`  | `[]`    | من 0 إلى 50 عنصرًا، كل منها <=100 حرف | العبارات الحرفية التي تجعل الالتقاط التلقائي يأخذ الرسالة في الحسبان. |

يضع `recallMaxChars` حدًا لاستعلام الاستدعاء التلقائي `before_prompt_build`،
وأداة `memory_recall`، ومسار استعلام `memory_forget`، وأمر `openclaw ltm
search`. يضمّن الاستدعاء التلقائي أحدث رسالة للمستخدم في الدور، ولا يعود
إلى الموجّه الكامل إلا عند عدم وجود رسالة مستخدم، مما يُبقي بيانات القناة
الوصفية وكتل الموجّه الكبيرة خارج طلب التضمين.

يتحكم `captureMaxChars` في ما إذا كانت رسالة المستخدم الواردة من حدث `agent_end`
الخاص بالدور قصيرة بما يكفي للنظر فيها للالتقاط التلقائي؛ ولا يؤثر في
استعلامات الاستدعاء.

يضيف `customTriggers` عبارات حرفية للالتقاط التلقائي دون تعبيرات نمطية. تغطي المشغّلات
المضمنة عبارات الذاكرة الشائعة بالإنجليزية والتشيكية والصينية واليابانية والكورية
(`remember` و`prefer` و`记住` و`覚えて` و`기억해` وما شابهها).

يرفض الالتقاط التلقائي أيضًا النص الذي يبدو كبيانات وصفية للغلاف/النقل،
أو حمولات لحقن الموجّهات، أو سياق `<relevant-memories>` سبق حقنه،
ويضع حدًا أقصى قدره 3 ذكريات ملتقطة لكل دور للوكيل.

## الأوامر

يسجّل `memory-lancedb` نطاق CLI‏ `ltm` متى كان مثبّتًا
(وليس فقط عندما يشغل فتحة الذاكرة النشطة):

```bash
openclaw ltm list [--limit <n>] [--order-by-created-at]
openclaw ltm search <query> [--limit <n>]
openclaw ltm stats
```

يشغّل `ltm query` استعلامًا غير متجهي مباشرةً على جدول LanceDB:

```bash
openclaw ltm query --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

| العلامة                              | القيمة الافتراضية                                 | ملاحظات                                                                                                                                     |
| --------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--cols <columns>`                | `id,text,importance,category,createdAt` | قائمة مسموح بها من الأعمدة مفصولة بفواصل.                                                                                                         |
| `--filter <condition>`            | لا شيء                                    | عبارة WHERE بأسلوب SQL. الحد الأقصى 200 حرف؛ ولا يُسمح إلا بالأحرف والأرقام و`_-` والمسافات و`='"<>!.,()%*`.                              |
| `--limit <n>`                     | `10`                                    | عدد صحيح موجب.                                                                                                                         |
| `--order-by <column>:<asc\|desc>` | لا شيء                                    | يُرتّب في الذاكرة بعد تشغيل عامل التصفية؛ ويُضاف عمود الترتيب تلقائيًا إلى الإسقاط ثم يُحذف من المخرجات إذا لم يكن مطلوبًا. |

تحصل الوكلاء على ثلاث أدوات من Plugin الذاكرة النشط:

- `memory_recall`: بحث متجهي في الذكريات المخزنة.
- `memory_store`: يحفظ حقيقة أو تفضيلاً أو قرارًا أو كيانًا (ويرفض النص
  الذي يبدو كحمولة لحقن الموجّهات، ويتخطى عمليات التخزين شبه المكررة).
- `memory_forget`: يحذف باستخدام `memoryId`، أو باستخدام `query` (يحذف تلقائيًا تطابقًا واحدًا
  بدرجة أعلى من 90%، وإلا يسرد معرّفات العناصر المرشحة لإزالة الالتباس).

## التخزين

تكون بيانات LanceDB افتراضيًا في `~/.openclaw/memory/lancedb`. ويمكن تجاوز ذلك باستخدام `dbPath`:

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

يقبل `storageOptions` أزواج مفاتيح/قيم نصية لواجهات التخزين الخلفية في LanceDB
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

## تبعيات بيئة التشغيل ودعم المنصات

يعتمد `memory-lancedb` على الحزمة الأصلية `@lancedb/lancedb` المملوكة
لحزمة Plugin (وليس لتوزيعة OpenClaw الأساسية). لا يصلح بدء تشغيل Gateway
تبعيات Plugin؛ فإذا كانت التبعية الأصلية مفقودة أو تعذر تحميلها،
فأعد تثبيت حزمة Plugin أو حدّثها، ثم أعد تشغيل Gateway.

لا تنشر `@lancedb/lancedb` إصدارًا أصليًا لـ `darwin-x64`‏ (أجهزة Mac بمعالج Intel).
على هذه المنصة، يسجّل Plugin عند التحميل أن LanceDB غير متاح؛ استخدم
واجهة الذاكرة الخلفية الافتراضية، أو شغّل Gateway على منصة/بنية مدعومة،
أو عطّل `memory-lancedb`.

## استكشاف الأخطاء وإصلاحها

### يتجاوز طول الإدخال طول السياق

رفض نموذج التضمين استعلام الاستدعاء:

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

اخفض `recallMaxChars`، ثم أعد تشغيل Gateway:

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

بالنسبة إلى Ollama، تحقق أيضًا من إمكانية الوصول إلى خادم التضمين من مضيف Gateway
باستخدام نقطة نهاية التضمين الأصلية الخاصة به:

```bash
curl http://127.0.0.1:11434/api/embed \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### نموذج تضمين غير مدعوم

دون `embedding.dimensions`، لا تكون معروفة سوى أبعاد تضمين OpenAI المضمنة
(`text-embedding-3-small` و`text-embedding-3-large`). لأي نموذج آخر،
عيّن `embedding.dimensions` إلى حجم المتجه الذي يبلّغ عنه ذلك النموذج.

### يتم تحميل Plugin ولكن لا تظهر أي ذكريات

تأكّد من أن `plugins.slots.memory` يشير إلى `memory-lancedb`، ثم شغّل:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

إذا كان `autoCapture` معطّلًا، فسيظل Plugin يسترجع الذكريات الموجودة، لكنه
لن يخزّن ذكريات جديدة تلقائيًا. استخدم أداة `memory_store`، أو فعّل
`autoCapture`.

## ذو صلة

- [نظرة عامة على الذاكرة](/ar/concepts/memory)
- [Active Memory](/ar/concepts/active-memory)
- [البحث في الذاكرة](/ar/concepts/memory-search)
- [ويكي الذاكرة](/ar/plugins/memory-wiki)
- [Ollama](/ar/providers/ollama)
