---
read_when:
    - تريد استخدام Featherless AI مع OpenClaw
    - تحتاج إلى متغير البيئة الخاص بمفتاح Featherless API أو إلى تنسيق مرجع النموذج
summary: إعداد Featherless AI واختيار النموذج واستدعاء الأدوات
title: Featherless AI
x-i18n:
    generated_at: "2026-07-12T06:28:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9112f7e65b4089bf96933c632d0b62f7fb87d42998d985ca85eb92dc392636b6
    source_path: providers/featherless.md
    workflow: 16
---

[Featherless AI](https://featherless.ai) يوفّر النماذج المفتوحة عبر واجهة API
متوافقة مع OpenAI. يثبّت OpenClaw ‏Featherless بوصفه Plugin موفّر خارجيًا رسميًا،
ويبقي الكتالوج المضمّن صغيرًا مع قبول معرّفات النماذج الدقيقة من Featherless في وقت التشغيل.

| الخاصية                | القيمة                                   |
| ---------------------- | ---------------------------------------- |
| معرّف الموفّر          | `featherless`                            |
| الحزمة                 | `@openclaw/featherless-provider`         |
| متغير بيئة المصادقة    | `FEATHERLESS_API_KEY`                    |
| علامة الإعداد الأولي   | `--auth-choice featherless-api-key`      |
| علامة CLI المباشرة     | `--featherless-api-key <key>`            |
| واجهة API              | متوافقة مع OpenAI (`openai-completions`) |
| عنوان URL الأساسي      | `https://api.featherless.ai/v1`          |
| النموذج الافتراضي      | `featherless/Qwen/Qwen3-32B`             |

## الإعداد

ثبّت Plugin وأعد تشغيل Gateway:

```bash
openclaw plugins install @openclaw/featherless-provider
openclaw gateway restart
```

شغّل الإعداد الأولي:

```bash
openclaw onboard --auth-choice featherless-api-key
```

للإعداد غير التفاعلي:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice featherless-api-key \
  --featherless-api-key "$FEATHERLESS_API_KEY"
```

أو أتح المفتاح لعملية Gateway:

```bash
export FEATHERLESS_API_KEY="<your-featherless-api-key>" # pragma: allowlist secret
```

تحقّق من الموفّر:

```bash
openclaw models list --provider featherless
```

## النموذج الافتراضي

يستخدم Plugin النموذج `Qwen/Qwen3-32B` بوصفه الإعداد الافتراضي لأن Featherless
يوثّق الاستدعاء الأصلي للأدوات لعائلة Qwen 3. يضبط OpenClaw نافذة السياق الخاصة به
على 32,768 رمزًا، وحدًا متحفظًا للإخراج يبلغ 4,096 رمزًا، وعناصر التحكم في التفكير
الخاصة بقالب محادثة Qwen.

حقول التكلفة في الكتالوج تساوي صفرًا لأن Featherless يدعم أوضاع فوترة متعددة،
ولأن OpenClaw لا يضمّن أسعار الخطط الخاصة بالحساب أو أسعار الطلبات.

## نماذج Featherless الأخرى

استخدم معرّف نموذج Featherless الدقيق بعد بادئة الموفّر `featherless/`:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "featherless/moonshotai/Kimi-K2-Instruct",
      },
    },
  },
}
```

يتعمّد OpenClaw عدم نسخ فهرس نماذج Featherless العام بالكامل إلى أداة الاختيار.
الفهرس كبير ولا يوفّر بيانات وصفية منظّمة كافية للقدرات لتصنيف كل نموذج نصوص
ورؤية وتضمين واستدلال بأمان. لذلك تُحلّ المعرّفات غير المعروفة باستخدام إعدادات
افتراضية متحفظة للنصوص فقط ومن دون استدلال: نافذة سياق بسعة 4,096 رمزًا وحد إخراج
بسعة 1,024 رمزًا.

أضف إدخالًا صريحًا لنموذج الموفّر عندما يحتاج النموذج إلى بيانات وصفية مختلفة:

```json5
{
  models: {
    mode: "merge",
    providers: {
      featherless: {
        baseUrl: "https://api.featherless.ai/v1",
        apiKey: "${FEATHERLESS_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "google/gemma-3-27b-it",
            name: "Gemma 3 27B",
            input: ["text", "image"],
            reasoning: false,
            contextWindow: 32768,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

راجع كتالوج نماذج Featherless لمعرفة مدى توفّر النماذج الحالي ووسوم القدرات
قبل إضافة بيانات وصفية مخصّصة.

## استكشاف الأخطاء وإصلاحها

- `401` أو `403`: تأكّد من أن `FEATHERLESS_API_KEY` مرئي لعملية Gateway،
  أو شغّل الإعداد الأولي مجددًا.
- نموذج غير معروف: استخدم المعرّف الدقيق الحساس لحالة الأحرف من Featherless بعد
  البادئة `featherless/`.
- عودة استدعاءات الأدوات كنص: اختر عائلة نماذج يوثّق Featherless دعمها للاستدعاء
  الأصلي للدوال، مثل Qwen 3.
- يتعذّر على Gateway المُدار رؤية المفتاح: ضعه في `~/.openclaw/.env` أو مصدر بيئة
  آخر تحمّله الخدمة، ثم أعد تشغيل Gateway.

## ذو صلة

- [موفّرو النماذج](/ar/concepts/model-providers)
- [جميع الموفّرين](/ar/providers/index)
- [أوضاع التفكير](/ar/tools/thinking)
