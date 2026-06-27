---
read_when:
    - أنت تقوم بتكوين Plugin memory-lancedb
    - تريد ذاكرة طويلة الأمد مدعومة بـ LanceDB مع الاستدعاء التلقائي أو الالتقاط التلقائي
    - أنت تستخدم تضمينات محلية متوافقة مع OpenAI مثل Ollama
sidebarTitle: Memory LanceDB
summary: تكوين Plugin الذاكرة الخارجي الرسمي LanceDB، بما في ذلك التضمينات المحلية المتوافقة مع Ollama
title: ذاكرة LanceDB
x-i18n:
    generated_at: "2026-06-27T18:07:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4142a755e788418a8b9c64a6ff3a8ce3c520bd6be09b685929478ae0754f7d39
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` هو Plugin ذاكرة خارجي رسمي يخزن الذاكرة طويلة الأمد في
LanceDB ويستخدم التضمينات للاسترجاع. يمكنه استرجاع الذكريات ذات الصلة تلقائيا
قبل دور النموذج والتقاط الحقائق المهمة بعد الرد.

استخدمه عندما تريد قاعدة بيانات متجهات محلية للذاكرة، أو تحتاج إلى نقطة نهاية
تضمين متوافقة مع OpenAI، أو تريد إبقاء قاعدة بيانات الذاكرة خارج مخزن الذاكرة
المدمج الافتراضي.

## التثبيت

ثبّت `memory-lancedb` قبل تعيين `plugins.slots.memory = "memory-lancedb"`:

```bash
openclaw plugins install @openclaw/memory-lancedb
```

ينشر Plugin على npm ولا يكون مضمنًا في صورة وقت تشغيل OpenClaw.
يكتب المثبّت إدخال Plugin ويبدّل خانة الذاكرة عندما لا يملكها أي
Plugin آخر.

<Note>
`memory-lancedb` هو Plugin Active Memory. فعّله بتحديد خانة الذاكرة
باستخدام `plugins.slots.memory = "memory-lancedb"`. يمكن تشغيل Plugins مرافقة مثل
`memory-wiki` إلى جانبه، لكن Plugin واحدًا فقط يملك خانة Active Memory.
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

أعد تشغيل Gateway بعد تغيير إعدادات Plugin:

```bash
openclaw gateway restart
```

ثم تحقق من تحميل Plugin:

```bash
openclaw plugins list
```

## التضمينات المدعومة بالمزوّدين

يمكن لـ `memory-lancedb` استخدام محولات مزوّد تضمينات الذاكرة نفسها التي يستخدمها
`memory-core`. عيّن `embedding.provider` واحذف `embedding.apiKey` لاستخدام
ملف تعريف المصادقة المهيأ للمزوّد، أو متغير البيئة، أو
`models.providers.<provider>.apiKey`.

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
        },
      },
    },
  },
}
```

يعمل هذا المسار مع ملفات تعريف مصادقة المزوّد التي تعرض بيانات اعتماد التضمينات.
على سبيل المثال، يمكن استخدام GitHub Copilot عندما يدعم ملف تعريف/خطة Copilot
التضمينات:

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
            provider: "github-copilot",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

OpenAI Codex / ChatGPT OAuth ليس بيانات اعتماد تضمينات OpenAI Platform.
لتضمينات OpenAI، استخدم ملف تعريف مصادقة بمفتاح OpenAI API،
أو `OPENAI_API_KEY`، أو `models.providers.openai.apiKey`. يمكن للمستخدمين المعتمدين على OAuth فقط استخدام
مزوّد آخر قادر على التضمين مثل GitHub Copilot أو Ollama.

## تضمينات Ollama

لتضمينات Ollama، يفضّل استخدام مزوّد تضمينات Ollama المضمن. يستخدم نقطة نهاية
Ollama الأصلية `/api/embed` ويتبع قواعد المصادقة/عنوان URL الأساسي نفسها مثل
مزوّد Ollama الموثق في [Ollama](/ar/providers/ollama).

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

عيّن `dimensions` لنماذج التضمين غير القياسية. يعرف OpenClaw
الأبعاد الخاصة بـ `text-embedding-3-small` و`text-embedding-3-large`؛ وتحتاج
النماذج المخصصة إلى القيمة في الإعدادات كي يتمكن LanceDB من إنشاء عمود المتجهات.

بالنسبة إلى نماذج التضمين المحلية الصغيرة، خفّض `recallMaxChars` إذا ظهرت لك أخطاء
طول السياق من الخادم المحلي.

## المزوّدون المتوافقون مع OpenAI

ترفض بعض مزوّدات التضمين المتوافقة مع OpenAI معلمة `encoding_format`،
بينما تتجاهلها أخرى وتعيد دائمًا متجهات `number[]`.
لذلك يحذف `memory-lancedb` معلمة `encoding_format` في طلبات التضمين ويقبل
إما استجابات مصفوفات الأعداد العشرية أو استجابات float32 المرمزة بـ base64.

إذا كانت لديك نقطة نهاية تضمينات خام متوافقة مع OpenAI ولا تملك
محول مزوّد مضمنًا، فاحذف `embedding.provider` (أو اتركه كـ `openai`) وعيّن
`embedding.apiKey` مع `embedding.baseUrl`. يحافظ هذا على مسار العميل المباشر
المتوافق مع OpenAI.

عيّن `embedding.dimensions` للمزوّدين الذين لا تكون أبعاد نماذجهم مدمجة.
على سبيل المثال، يستخدم ZhiPu `embedding-3` أبعادًا بقيمة `2048`:

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

## حدود الاسترجاع والالتقاط

يحتوي `memory-lancedb` على حدين منفصلين للنص:

| الإعداد           | الافتراضي | النطاق     | ينطبق على                                                |
| ----------------- | ------- | --------- | --------------------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000 | النص المرسل إلى واجهة API التضمين للاسترجاع                 |
| `captureMaxChars` | `500`   | 100-10000 | طول الرسالة المؤهلة للالتقاط التلقائي                  |
| `customTriggers`  | `[]`    | 0-50      | عبارات حرفية تجعل الالتقاط التلقائي يأخذ رسالة في الاعتبار |

يتحكم `recallMaxChars` في الاسترجاع التلقائي، وأداة `memory_recall`، ومسار استعلام
`memory_forget`، و`openclaw ltm search`. يفضّل الاسترجاع التلقائي
أحدث رسالة مستخدم من الدور، ويعود إلى الموجّه الكامل فقط عندما لا تكون هناك
رسالة مستخدم متاحة. هذا يبقي بيانات تعريف القناة وكتل الموجّهات الكبيرة
خارج طلب التضمين.

يتحكم `captureMaxChars` فيما إذا كان الرد قصيرًا بما يكفي للنظر فيه
للالتقاط التلقائي. ولا يحد من تضمينات استعلامات الاسترجاع.

يتيح لك `customTriggers` إضافة عبارات التقاط تلقائي حرفية دون كتابة
تعابير نمطية. تتضمن المشغلات المدمجة عبارات ذاكرة شائعة بالإنجليزية والتشيكية
والصينية واليابانية والكورية.

## الأوامر

عندما يكون `memory-lancedb` هو Plugin الذاكرة النشط، فإنه يسجل مساحة أسماء CLI
`ltm`:

```bash
openclaw ltm list
openclaw ltm search "project preferences"
openclaw ltm stats
```

يشغّل الأمر الفرعي `query` استعلامًا غير متجهي على جدول LanceDB
مباشرة:

```bash
openclaw ltm query --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

- `--cols <columns>`: قائمة سماح بالأعمدة مفصولة بفواصل (الافتراضي هو `id` و`text` و`importance` و`category` و`createdAt`).
- `--filter <condition>`: عبارة WHERE بأسلوب SQL؛ محدودة بـ 200 حرف ومقيدة بالأحرف الأبجدية الرقمية، وعوامل المقارنة، وعلامات الاقتباس، والأقواس، ومجموعة صغيرة من علامات الترقيم الآمنة.
- `--limit <n>`: عدد صحيح موجب؛ الافتراضي `10`.
- `--order-by <column>:<asc|desc>`: فرز في الذاكرة يطبق بعد المرشح؛ يدرج عمود الفرز تلقائيًا في الإسقاط.

يحصل الوكلاء أيضًا على أدوات ذاكرة LanceDB من Plugin الذاكرة النشط:

- `memory_recall` للاسترجاع المدعوم بـ LanceDB
- `memory_store` لحفظ الحقائق والتفضيلات والقرارات والكيانات المهمة
- `memory_forget` لإزالة الذكريات المطابقة

## التخزين

افتراضيًا، تعيش بيانات LanceDB تحت `~/.openclaw/memory/lancedb`. تجاوز
المسار باستخدام `dbPath`:

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

يقبل `storageOptions` أزواج مفاتيح/قيم نصية لخلفيات تخزين LanceDB ويدعم
توسيع `${ENV_VAR}`:

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

## تبعيات وقت التشغيل

يعتمد `memory-lancedb` على الحزمة الأصلية `@lancedb/lancedb`. يتعامل OpenClaw
المعبأ مع تلك الحزمة كجزء من حزمة Plugin. لا يصلح بدء تشغيل Gateway
تبعيات Plugin؛ إذا كانت التبعية مفقودة، فأعد تثبيت حزمة Plugin أو
حدّثها ثم أعد تشغيل Gateway.

إذا سجّل تثبيت أقدم خطأ `dist/package.json` مفقودًا أو خطأ
`@lancedb/lancedb` مفقودًا أثناء تحميل Plugin، فرَقِّ OpenClaw وأعد تشغيل
Gateway.

إذا سجّل Plugin أن LanceDB غير متاح على `darwin-x64`، فاستخدم خلفية
الذاكرة الافتراضية على ذلك الجهاز، أو انقل Gateway إلى منصة مدعومة، أو
عطّل `memory-lancedb`.

## استكشاف الأخطاء وإصلاحها

### يتجاوز طول الإدخال طول السياق

يعني هذا عادة أن نموذج التضمين رفض استعلام الاسترجاع:

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

عيّن قيمة أقل لـ `recallMaxChars`، ثم أعد تشغيل Gateway:

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

بالنسبة إلى Ollama، تحقق أيضًا من إمكانية وصول خادم التضمين من مضيف Gateway:

```bash
curl http://127.0.0.1:11434/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### نموذج تضمين غير مدعوم

بدون `dimensions`، لا تكون معروفة إلا أبعاد تضمين OpenAI المدمجة.
بالنسبة إلى نماذج التضمين المحلية أو المخصصة، عيّن `embedding.dimensions` إلى حجم
المتجه الذي يبلّغ عنه ذلك النموذج.

### يتم تحميل Plugin لكن لا تظهر أي ذكريات

تحقق من أن `plugins.slots.memory` يشير إلى `memory-lancedb`، ثم شغّل:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

إذا كان `autoCapture` معطلًا، فسوف يسترجع Plugin الذكريات الموجودة لكنه
لن يخزن ذكريات جديدة تلقائيًا. استخدم أداة `memory_store` أو فعّل
`autoCapture` إذا كنت تريد الالتقاط التلقائي.

## ذو صلة

- [نظرة عامة على الذاكرة](/ar/concepts/memory)
- [Active Memory](/ar/concepts/active-memory)
- [بحث الذاكرة](/ar/concepts/memory-search)
- [Memory Wiki](/ar/plugins/memory-wiki)
- [Ollama](/ar/providers/ollama)
