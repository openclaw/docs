---
read_when:
    - تريد مفتاح واجهة برمجة تطبيقات واحدًا للعديد من نماذج اللغة الكبيرة
    - تريد تشغيل النماذج عبر OpenRouter في OpenClaw
    - تريد استخدام OpenRouter لتوليد الصور
    - تريد استخدام OpenRouter لتوليد الفيديو
summary: استخدم واجهة برمجة التطبيقات الموحّدة من OpenRouter للوصول إلى العديد من النماذج في OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-04T07:09:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: f6b7299408aa0de7530e2248c7fa5dae8c09095e2d20a0e9d12a64cab83966fc
    source_path: providers/openrouter.md
    workflow: 16
---

يوفر OpenRouter **واجهة API موحدة** توجّه الطلبات إلى العديد من النماذج خلف نقطة
نهاية واحدة ومفتاح API واحد. وهي متوافقة مع OpenAI، لذلك تعمل معظم حزم OpenAI SDK عبر تبديل عنوان URL الأساسي.

## البدء

<Steps>
  <Step title="احصل على مفتاح API الخاص بك">
    أنشئ مفتاح API في [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="شغّل الإعداد الأولي">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(اختياري) بدّل إلى نموذج محدد">
    يستخدم الإعداد الأولي `openrouter/auto` افتراضياً. اختر نموذجاً محدداً لاحقاً:

    ```bash
    openclaw models set openrouter/<provider>/<model>
    ```

  </Step>
</Steps>

## مثال إعداد

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## مراجع النماذج

<Note>
تتبع مراجع النماذج النمط `openrouter/<provider>/<model>`. للاطلاع على القائمة الكاملة
للموفرين والنماذج المتاحة، راجع [/concepts/model-providers](/ar/concepts/model-providers).
</Note>

أمثلة احتياطية مضمّنة:

| مرجع النموذج                     | ملاحظات                     |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | توجيه OpenRouter التلقائي    |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 عبر MoonshotAI     |

## إنشاء الصور

يمكن أن يدعم OpenRouter أيضاً أداة `image_generate`. استخدم نموذج صور من OpenRouter ضمن `agents.defaults.imageGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
        timeoutMs: 180_000,
      },
    },
  },
}
```

يرسل OpenClaw طلبات الصور إلى واجهة API لصور إكمالات الدردشة في OpenRouter مع `modalities: ["image", "text"]`. تتلقى نماذج صور Gemini تلميحات `aspectRatio` و`resolution` المدعومة من خلال `image_config` الخاص بـ OpenRouter. استخدم `agents.defaults.imageGenerationModel.timeoutMs` لنماذج صور OpenRouter الأبطأ؛ يظل معامل `timeoutMs` لكل استدعاء في أداة `image_generate` هو صاحب الأولوية.

## إنشاء الفيديو

يمكن أن يدعم OpenRouter أيضاً أداة `video_generate` من خلال واجهة API غير المتزامنة `/videos` الخاصة به. استخدم نموذج فيديو من OpenRouter ضمن `agents.defaults.videoGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "openrouter/google/veo-3.1-fast",
      },
    },
  },
}
```

يرسل OpenClaw مهام تحويل النص إلى فيديو وتحويل الصورة إلى فيديو إلى OpenRouter، ويستطلع
`polling_url` المُعاد، ثم ينزّل الفيديو المكتمل من
`unsigned_urls` الخاصة بـ OpenRouter أو من نقطة نهاية محتوى المهمة الموثقة.
تُرسل الصور المرجعية كصور للإطار الأول/الأخير افتراضياً؛ أما الصور
الموسومة بـ `reference_image` فتُرسل كمراجع إدخال في OpenRouter. يعلن
الافتراضي المضمّن `google/veo-3.1-fast` عن مدد 4/6/8
ثوانٍ المدعومة حالياً، ودقات `720P`/`1080P`، ونسب العرض إلى الارتفاع
`16:9`/`9:16`. لا يُسجَّل تحويل الفيديو إلى فيديو في OpenRouter لأن واجهة API
لإنشاء الفيديو في المنبع تقبل حالياً مراجع النصوص والصور.

## تحويل النص إلى كلام

يمكن استخدام OpenRouter أيضاً كموفر TTS من خلال نقطة النهاية المتوافقة مع OpenAI
`/audio/speech`.

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

إذا حُذف `messages.tts.providers.openrouter.apiKey`، فسيعيد TTS استخدام
`models.providers.openrouter.apiKey`، ثم `OPENROUTER_API_KEY`.

## المصادقة والرؤوس

يستخدم OpenRouter رمز Bearer مع مفتاح API الخاص بك في الخلفية.

في طلبات OpenRouter الحقيقية (`https://openrouter.ai/api/v1`)، يضيف OpenClaw أيضاً
رؤوس إسناد التطبيق الموثقة لدى OpenRouter:

| الرأس                     | القيمة                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
إذا أعدت توجيه موفر OpenRouter إلى وسيط أو عنوان URL أساسي آخر، فإن OpenClaw
**لا** يحقن هذه الرؤوس الخاصة بـ OpenRouter أو علامات ذاكرة Anthropic المؤقتة.
</Warning>

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="التخزين المؤقت للاستجابات">
    التخزين المؤقت لاستجابات OpenRouter اختياري. فعّله لكل نموذج OpenRouter باستخدام
    معاملات النموذج:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openrouter/auto": {
              params: {
                responseCache: true,
                responseCacheTtlSeconds: 300,
              },
            },
          },
        },
      },
    }
    ```

    يرسل OpenClaw `X-OpenRouter-Cache: true`، وعند الإعداد،
    `X-OpenRouter-Cache-TTL`. يفرض `responseCacheClear: true` تحديثاً
    للطلب الحالي ويخزن الاستجابة البديلة. كما تُقبل الأسماء البديلة بصيغة Snake_case
    (`response_cache`، و`response_cache_ttl_seconds`، و
    `response_cache_clear`).

    هذا منفصل عن التخزين المؤقت لمطالبات الموفر وعن علامات Anthropic
    `cache_control` الخاصة بـ OpenRouter. ولا يُطبَّق إلا على مسارات
    `openrouter.ai` المتحقق منها، وليس على عناوين URL الأساسية لوسطاء مخصصين.

  </Accordion>

  <Accordion title="علامات ذاكرة Anthropic المؤقتة">
    في مسارات OpenRouter المتحقق منها، تحتفظ مراجع نماذج Anthropic بعلامات
    Anthropic `cache_control` الخاصة بـ OpenRouter التي يستخدمها OpenClaw
    لتحسين إعادة استخدام ذاكرة المطالبات المؤقتة في كتل مطالبات النظام/المطور.
  </Accordion>

  <Accordion title="التعبئة المسبقة لاستدلال Anthropic">
    في مسارات OpenRouter المتحقق منها، تُسقط مراجع نماذج Anthropic التي تم تمكين الاستدلال لها
    أدوار التعبئة المسبقة اللاحقة للمساعد قبل وصول الطلب إلى OpenRouter،
    بما يطابق متطلب Anthropic بأن تنتهي محادثات الاستدلال بدور مستخدم.
  </Accordion>

  <Accordion title="إدخال التفكير / الاستدلال">
    في المسارات المدعومة غير `auto`، يربط OpenClaw مستوى التفكير المحدد
    بحمولات استدلال وسيط OpenRouter. تتجاوز تلميحات النماذج غير المدعومة و
    `openrouter/auto` هذا الإدخال للاستدلال. يتجاوز Hunter Alpha أيضاً
    استدلال الوسيط لمراجع النماذج المضبوطة القديمة لأن OpenRouter قد
    يعيد نص الإجابة النهائي في حقول الاستدلال لذلك المسار المتقاعد.
  </Accordion>

  <Accordion title="إعادة تشغيل استدلال DeepSeek V4">
    في مسارات OpenRouter المتحقق منها، يملأ `openrouter/deepseek/deepseek-v4-flash` و
    `openrouter/deepseek/deepseek-v4-pro` محتوى `reasoning_content` المفقود في
    أدوار المساعد المعاد تشغيلها حتى تحافظ محادثات التفكير/الأدوات على
    شكل المتابعة المطلوب في DeepSeek V4.
  </Accordion>

  <Accordion title="تشكيل الطلبات الخاص بـ OpenAI فقط">
    لا يزال OpenRouter يعمل عبر المسار المتوافق مع OpenAI بنمط الوسيط، لذلك
    لا تُمرَّر عمليات تشكيل الطلبات الأصلية الخاصة بـ OpenAI فقط مثل `serviceTier`، و`store` في Responses،
    وحمولات توافق استدلال OpenAI، وتلميحات ذاكرة المطالبات المؤقتة.
  </Accordion>

  <Accordion title="مسارات مدعومة بـ Gemini">
    تبقى مراجع OpenRouter المدعومة بـ Gemini على مسار proxy-Gemini: يحتفظ OpenClaw
    بتنظيف توقيع التفكير في Gemini هناك، لكنه لا يفعّل تحقق إعادة التشغيل الأصلي في Gemini
    أو عمليات إعادة كتابة التمهيد.
  </Accordion>

  <Accordion title="بيانات تعريف توجيه الموفر">
    إذا مررت توجيه موفر OpenRouter ضمن معاملات النموذج، يمرره OpenClaw
    كبيانات تعريف لتوجيه OpenRouter قبل تشغيل أغلفة البث المشتركة.
  </Accordion>
</AccordionGroup>

## ذات صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفرين، ومراجع النماذج، وسلوك تجاوز الفشل.
  </Card>
  <Card title="مرجع الإعداد" href="/ar/gateway/configuration-reference" icon="gear">
    مرجع الإعداد الكامل للوكلاء، والنماذج، والموفرين.
  </Card>
</CardGroup>
