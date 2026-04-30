---
read_when:
    - أنت تهيئ Plugin memory-lancedb المضمّن
    - تريد ذاكرة طويلة الأمد مدعومة بـ LanceDB مع استدعاء تلقائي أو التقاط تلقائي
    - أنت تستخدم تضمينات محلية متوافقة مع OpenAI مثل Ollama
sidebarTitle: Memory LanceDB
summary: هيّئ Plugin ذاكرة LanceDB المضمّن، بما في ذلك التضمينات المحلية المتوافقة مع Ollama
title: ذاكرة LanceDB
x-i18n:
    generated_at: "2026-04-30T08:14:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: bda53528857a492f1627f655e49be6775e0114115781371ff67debb155b7e731
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` هو Plugin ذاكرة مضمّن يخزّن الذاكرة طويلة الأمد في
LanceDB ويستخدم التضمينات للاسترجاع. يمكنه استرجاع الذكريات ذات الصلة تلقائيا
قبل دور النموذج والتقاط الحقائق المهمة بعد الرد.

استخدمه عندما تريد قاعدة بيانات متجهات محلية للذاكرة، أو تحتاج إلى نقطة نهاية
تضمين متوافقة مع OpenAI، أو تريد الاحتفاظ بقاعدة بيانات ذاكرة خارج
مخزن الذاكرة المضمّن الافتراضي.

<Note>
`memory-lancedb` هو Plugin Active Memory. فعّله عن طريق تحديد خانة الذاكرة
باستخدام `plugins.slots.memory = "memory-lancedb"`. يمكن تشغيل Plugins مرافقة مثل
`memory-wiki` بجانبه، لكن Plugin واحدا فقط يملك خانة الذاكرة النشطة.
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

## تضمينات مدعومة بموفّر

يمكن لـ `memory-lancedb` استخدام محولات موفّري تضمين الذاكرة نفسها التي يستخدمها
`memory-core`. اضبط `embedding.provider` واحذف `embedding.apiKey` لاستخدام
ملف تعريف المصادقة المكوّن للموفّر، أو متغير البيئة، أو
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

يعمل هذا المسار مع ملفات تعريف مصادقة الموفّر التي تعرض بيانات اعتماد التضمين.
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

مصادقة OpenAI Codex / ChatGPT عبر OAuth (`openai-codex`) ليست بيانات اعتماد
تضمينات OpenAI Platform. لتضمينات OpenAI، استخدم ملف تعريف مصادقة بمفتاح
OpenAI API، أو `OPENAI_API_KEY`، أو `models.providers.openai.apiKey`. يمكن
للمستخدمين الذين لديهم OAuth فقط استخدام موفّر آخر قادر على التضمين مثل GitHub Copilot أو Ollama.

## تضمينات Ollama

لتضمينات Ollama، فضّل موفّر تضمينات Ollama المضمّن. يستخدم نقطة نهاية Ollama
الأصلية `/api/embed` ويتبع قواعد المصادقة/عنوان URL الأساسي نفسها الخاصة بموفّر
Ollama الموثقة في [Ollama](/ar/providers/ollama).

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

اضبط `dimensions` لنماذج التضمين غير القياسية. يعرف OpenClaw أبعاد
`text-embedding-3-small` و`text-embedding-3-large`؛ وتحتاج النماذج المخصصة إلى
القيمة في الإعدادات حتى يتمكن LanceDB من إنشاء عمود المتجهات.

بالنسبة لنماذج التضمين المحلية الصغيرة، خفّض `recallMaxChars` إذا رأيت أخطاء
طول السياق من الخادم المحلي.

## موفّرون متوافقون مع OpenAI

بعض موفّري التضمين المتوافقين مع OpenAI يرفضون معامل `encoding_format`،
بينما يتجاهله آخرون ويعيدون دائما متجهات `number[]`. لذلك يحذف
`memory-lancedb` معامل `encoding_format` في طلبات التضمين ويقبل إما استجابات
مصفوفات الأعداد العائمة أو استجابات float32 المشفرة بـ base64.

إذا كانت لديك نقطة نهاية تضمينات خام متوافقة مع OpenAI ولا تملك محول موفّر
مضمّنا، فاحذف `embedding.provider` (أو اتركه كـ `openai`) واضبط
`embedding.apiKey` إضافة إلى `embedding.baseUrl`. يحافظ هذا على مسار العميل
المباشر المتوافق مع OpenAI.

اضبط `embedding.dimensions` للموفّرين الذين لا تكون أبعاد نماذجهم مضمّنة.
على سبيل المثال، يستخدم ZhiPu `embedding-3` أبعادا قدرها `2048`:

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

يملك `memory-lancedb` حدين نصيين منفصلين:

| الإعداد           | الافتراضي | النطاق    | ينطبق على                                    |
| ----------------- | ------- | --------- | --------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000 | النص المرسل إلى واجهة API للتضمين من أجل الاسترجاع |
| `captureMaxChars` | `500`   | 100-10000 | طول رسالة المساعد المؤهل للالتقاط |

يتحكم `recallMaxChars` في الاسترجاع التلقائي، وأداة `memory_recall`، ومسار
استعلام `memory_forget`، و`openclaw ltm search`. يفضّل الاسترجاع التلقائي
أحدث رسالة مستخدم من الدور، ولا يعود إلى الموجّه الكامل إلا عندما لا تتوفر
رسالة مستخدم. يحافظ هذا على إبقاء بيانات تعريف القناة وكتل الموجّه الكبيرة
خارج طلب التضمين.

يتحكم `captureMaxChars` فيما إذا كان الرد قصيرا بما يكفي للنظر في التقاطه
تلقائيا. ولا يحدّ من تضمينات استعلام الاسترجاع.

## الأوامر

عندما يكون `memory-lancedb` هو Plugin الذاكرة النشط، فإنه يسجل مساحة أسماء CLI
`ltm`:

```bash
openclaw ltm list
openclaw ltm search "project preferences"
openclaw ltm stats
```

يوسّع Plugin أيضا `openclaw memory` بأمر فرعي `query` غير متجهي
يعمل مباشرة على جدول LanceDB:

```bash
openclaw memory query --cols id,text,createdAt --limit 20
openclaw memory query --filter "category = 'preference'" --order-by createdAt:desc
```

- `--cols <columns>`: قائمة سماح للأعمدة مفصولة بفواصل (القيم الافتراضية هي `id` و`text` و`importance` و`category` و`createdAt`).
- `--filter <condition>`: عبارة WHERE بأسلوب SQL؛ محدودة بـ 200 حرف ومقيدة بالأحرف الأبجدية الرقمية، وعوامل المقارنة، وعلامات الاقتباس، والأقواس، ومجموعة صغيرة من علامات الترقيم الآمنة.
- `--limit <n>`: عدد صحيح موجب؛ الافتراضي `10`.
- `--order-by <column>:<asc|desc>`: فرز داخل الذاكرة يطبّق بعد عامل التصفية؛ يتم تضمين عمود الفرز تلقائيا في الإسقاط.

يحصل الوكلاء أيضا على أدوات ذاكرة LanceDB من Plugin الذاكرة النشط:

- `memory_recall` للاسترجاع المدعوم بـ LanceDB
- `memory_store` لحفظ الحقائق المهمة، والتفضيلات، والقرارات، والكيانات
- `memory_forget` لإزالة الذكريات المطابقة

## التخزين

افتراضيا، توجد بيانات LanceDB تحت `~/.openclaw/memory/lancedb`. تجاوز المسار
باستخدام `dbPath`:

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
ويدعم توسيع `${ENV_VAR}`:

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

يعتمد `memory-lancedb` على حزمة `@lancedb/lancedb` الأصلية. تحاول تثبيتات
OpenClaw المعبأة أولا استخدام تبعية وقت التشغيل المضمّنة، ويمكنها إصلاح تبعية
وقت تشغيل Plugin ضمن حالة OpenClaw عندما لا يكون الاستيراد المضمّن متاحا.

إذا سجّل تثبيت أقدم خطأ `dist/package.json` مفقودا أو خطأ
`@lancedb/lancedb` مفقودا أثناء تحميل Plugin، فقم بترقية OpenClaw وأعد تشغيل
Gateway.

إذا سجّل Plugin أن LanceDB غير متاح على `darwin-x64`، فاستخدم واجهة الذاكرة
الخلفية الافتراضية على ذلك الجهاز، أو انقل Gateway إلى منصة مدعومة، أو عطّل
`memory-lancedb`.

## استكشاف الأخطاء وإصلاحها

### طول الإدخال يتجاوز طول السياق

يعني هذا عادة أن نموذج التضمين رفض استعلام الاسترجاع:

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

اضبط `recallMaxChars` على قيمة أقل، ثم أعد تشغيل Gateway:

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

بالنسبة إلى Ollama، تحقق أيضا من إمكانية وصول مضيف Gateway إلى خادم التضمين:

```bash
curl http://127.0.0.1:11434/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### نموذج تضمين غير مدعوم

من دون `dimensions`، لا تُعرف إلا أبعاد تضمينات OpenAI المضمّنة. بالنسبة
لنماذج التضمين المحلية أو المخصصة، اضبط `embedding.dimensions` على حجم المتجه
الذي يبلّغ عنه ذلك النموذج.

### يتم تحميل Plugin لكن لا تظهر أي ذكريات

تحقق من أن `plugins.slots.memory` يشير إلى `memory-lancedb`، ثم شغّل:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

إذا كان `autoCapture` معطلا، فسيسترجع Plugin الذكريات الموجودة لكنه لن يخزن
ذكريات جديدة تلقائيا. استخدم أداة `memory_store` أو فعّل `autoCapture` إذا كنت
تريد الالتقاط التلقائي.

## ذات صلة

- [نظرة عامة على الذاكرة](/ar/concepts/memory)
- [Active Memory](/ar/concepts/active-memory)
- [بحث الذاكرة](/ar/concepts/memory-search)
- [Memory Wiki](/ar/plugins/memory-wiki)
- [Ollama](/ar/providers/ollama)
