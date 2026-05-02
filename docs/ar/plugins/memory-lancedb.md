---
read_when:
    - أنت تهيّئ Plugin memory-lancedb المضمّن
    - تريد ذاكرة طويلة الأمد مدعومة بـ LanceDB مع الاستدعاء التلقائي أو الالتقاط التلقائي
    - أنت تستخدم تضمينات محلية متوافقة مع OpenAI مثل Ollama
sidebarTitle: Memory LanceDB
summary: تكوين Plugin الذاكرة LanceDB المضمّن، بما في ذلك التضمينات المحلية المتوافقة مع Ollama
title: ذاكرة LanceDB
x-i18n:
    generated_at: "2026-05-02T07:37:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 671daa20e4f070f9beb0187ff76db9368297b3bc78873ebf3f09ac7ccffa00a2
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` هو Plugin ذاكرة مضمّن يخزّن الذاكرة طويلة المدى في
LanceDB ويستخدم التضمينات للاسترجاع. يمكنه استرجاع الذكريات ذات الصلة تلقائيًا
قبل دورة النموذج والتقاط الحقائق المهمة بعد الرد.

استخدمه عندما تريد قاعدة بيانات متجهات محلية للذاكرة، أو تحتاج إلى نقطة نهاية
تضمين متوافقة مع OpenAI، أو تريد إبقاء قاعدة بيانات الذاكرة خارج مخزن الذاكرة
المضمّن الافتراضي.

<Note>
`memory-lancedb` هو Plugin Active Memory. فعّله باختيار فتحة الذاكرة باستخدام
`plugins.slots.memory = "memory-lancedb"`. يمكن تشغيل Plugins مرافقة مثل
`memory-wiki` بجانبه، لكن Plugin واحد فقط يملك فتحة Active Memory.
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

ثم تحقّق من تحميل Plugin:

```bash
openclaw plugins list
```

## التضمينات المدعومة بمزوّد

يمكن لـ `memory-lancedb` استخدام محوّلات مزوّد تضمينات الذاكرة نفسها التي
يستخدمها `memory-core`. عيّن `embedding.provider` واحذف `embedding.apiKey`
لاستخدام ملف تعريف المصادقة المكوّن للمزوّد، أو متغير البيئة، أو
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

يعمل هذا المسار مع ملفات تعريف مصادقة المزوّد التي تكشف بيانات اعتماد التضمينات.
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

مصادقة OpenAI Codex / ChatGPT OAuth (`openai-codex`) ليست بيانات اعتماد
تضمينات OpenAI Platform. لتضمينات OpenAI، استخدم ملف تعريف مصادقة لمفتاح
OpenAI API، أو `OPENAI_API_KEY`، أو `models.providers.openai.apiKey`. يمكن
للمستخدمين الذين لديهم OAuth فقط استخدام مزوّد آخر قادر على التضمين مثل
GitHub Copilot أو Ollama.

## تضمينات Ollama

لتضمينات Ollama، يُفضّل استخدام مزوّد تضمينات Ollama المضمّن. فهو يستخدم نقطة
نهاية Ollama الأصلية `/api/embed` ويتبع قواعد المصادقة/عنوان URL الأساسي نفسها
الخاصة بمزوّد Ollama الموثقة في [Ollama](/ar/providers/ollama).

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

عيّن `dimensions` لنماذج التضمين غير القياسية. يعرف OpenClaw الأبعاد الخاصة بـ
`text-embedding-3-small` و`text-embedding-3-large`؛ تحتاج النماذج المخصصة إلى
القيمة في الإعدادات كي يتمكن LanceDB من إنشاء عمود المتجه.

بالنسبة إلى نماذج التضمين المحلية الصغيرة، خفّض `recallMaxChars` إذا رأيت
أخطاء طول السياق من الخادم المحلي.

## المزوّدون المتوافقون مع OpenAI

يرفض بعض مزوّدي التضمينات المتوافقين مع OpenAI معامل `encoding_format`، بينما
يتجاهله آخرون ويُرجعون دائمًا متجهات `number[]`. لذلك يحذف `memory-lancedb`
`encoding_format` من طلبات التضمين ويقبل إما ردود مصفوفات الأعداد العشرية أو
ردود float32 المشفرة بـ base64.

إذا كانت لديك نقطة نهاية تضمينات خام متوافقة مع OpenAI ولا تملك محوّل مزوّد
مضمّنًا، فاحذف `embedding.provider` (أو اتركه `openai`) وعيّن
`embedding.apiKey` مع `embedding.baseUrl`. هذا يحافظ على مسار العميل المباشر
المتوافق مع OpenAI.

عيّن `embedding.dimensions` للمزوّدين الذين لا تكون أبعاد نماذجهم مضمّنة. على
سبيل المثال، يستخدم ZhiPu `embedding-3` أبعادًا بعدد `2048`:

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

لدى `memory-lancedb` حدّان منفصلان للنص:

| الإعداد           | الافتراضي | النطاق     | ينطبق على                                    |
| ----------------- | ------- | --------- | --------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000 | النص المُرسل إلى واجهة API للتضمين للاسترجاع     |
| `captureMaxChars` | `500`   | 100-10000 | طول رسالة المساعد المؤهل للالتقاط |

يتحكم `recallMaxChars` في الاسترجاع التلقائي، وأداة `memory_recall`، ومسار
استعلام `memory_forget`، و`openclaw ltm search`. يفضّل الاسترجاع التلقائي أحدث
رسالة مستخدم من الدورة، ويعود إلى الموجّه الكامل فقط عندما لا تتوفر رسالة
مستخدم. هذا يُبقي بيانات القناة الوصفية وكتل الموجّه الكبيرة خارج طلب التضمين.

يتحكم `captureMaxChars` فيما إذا كان الرد قصيرًا بما يكفي ليؤخذ في الاعتبار
للالتقاط التلقائي. ولا يحدّ تضمينات استعلام الاسترجاع.

## الأوامر

عندما يكون `memory-lancedb` هو Plugin الذاكرة النشط، فإنه يسجّل مساحة أسماء
CLI باسم `ltm`:

```bash
openclaw ltm list
openclaw ltm search "project preferences"
openclaw ltm stats
```

يوسّع Plugin أيضًا `openclaw memory` بأمر فرعي `query` غير متجهي يعمل مباشرة
على جدول LanceDB:

```bash
openclaw memory query --cols id,text,createdAt --limit 20
openclaw memory query --filter "category = 'preference'" --order-by createdAt:desc
```

- `--cols <columns>`: قائمة أعمدة مفصولة بفواصل ومسموح بها (القيم الافتراضية هي `id`، و`text`، و`importance`، و`category`، و`createdAt`).
- `--filter <condition>`: عبارة WHERE بأسلوب SQL؛ محدودة بـ 200 حرف ومقيّدة بالأحرف والأرقام، وعوامل المقارنة، وعلامات الاقتباس، والأقواس، ومجموعة صغيرة من علامات الترقيم الآمنة.
- `--limit <n>`: عدد صحيح موجب؛ الافتراضي `10`.
- `--order-by <column>:<asc|desc>`: فرز داخل الذاكرة يُطبّق بعد عامل التصفية؛ يُدرج عمود الفرز تلقائيًا في الإسقاط.

يحصل الوكلاء أيضًا على أدوات ذاكرة LanceDB من Plugin الذاكرة النشط:

- `memory_recall` للاسترجاع المدعوم بـ LanceDB
- `memory_store` لحفظ الحقائق والتفضيلات والقرارات والكيانات المهمة
- `memory_forget` لإزالة الذكريات المطابقة

## التخزين

افتراضيًا، توجد بيانات LanceDB ضمن `~/.openclaw/memory/lancedb`. تجاوز المسار
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

يقبل `storageOptions` أزواج مفاتيح/قيم نصية لخلفيات تخزين LanceDB ويدعم توسيع
`${ENV_VAR}`:

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

يعتمد `memory-lancedb` على حزمة `@lancedb/lancedb` الأصلية. يتعامل OpenClaw
المعبأ مع تلك الحزمة كجزء من حزمة Plugin. لا يصلح بدء تشغيل Gateway تبعيات
Plugin؛ إذا كانت التبعية مفقودة، فأعد تثبيت حزمة Plugin أو حدّثها ثم أعد تشغيل
Gateway.

إذا سجّل تثبيت أقدم خطأ عن `dist/package.json` مفقود أو `@lancedb/lancedb`
مفقود أثناء تحميل Plugin، فقم بترقية OpenClaw وأعد تشغيل Gateway.

إذا سجّل Plugin أن LanceDB غير متاح على `darwin-x64`، فاستخدم خلفية الذاكرة
الافتراضية على ذلك الجهاز، أو انقل Gateway إلى منصة مدعومة، أو عطّل
`memory-lancedb`.

## استكشاف الأخطاء وإصلاحها

### طول الإدخال يتجاوز طول السياق

يعني هذا عادةً أن نموذج التضمين رفض استعلام الاسترجاع:

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

بالنسبة إلى Ollama، تحقّق أيضًا من أن خادم التضمين قابل للوصول من مضيف
Gateway:

```bash
curl http://127.0.0.1:11434/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### نموذج تضمين غير مدعوم

من دون `dimensions`، لا تُعرف إلا أبعاد تضمينات OpenAI المضمّنة. بالنسبة إلى
نماذج التضمين المحلية أو المخصصة، عيّن `embedding.dimensions` إلى حجم المتجه
الذي يبلّغ عنه ذلك النموذج.

### يتم تحميل Plugin لكن لا تظهر أي ذكريات

تحقّق من أن `plugins.slots.memory` يشير إلى `memory-lancedb`، ثم شغّل:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

إذا كان `autoCapture` معطّلًا، فسيسترجع Plugin الذكريات الموجودة لكنه لن يخزّن
ذكريات جديدة تلقائيًا. استخدم أداة `memory_store` أو فعّل `autoCapture` إذا
كنت تريد الالتقاط التلقائي.

## ذات صلة

- [نظرة عامة على الذاكرة](/ar/concepts/memory)
- [Active Memory](/ar/concepts/active-memory)
- [بحث الذاكرة](/ar/concepts/memory-search)
- [ويكي الذاكرة](/ar/plugins/memory-wiki)
- [Ollama](/ar/providers/ollama)
