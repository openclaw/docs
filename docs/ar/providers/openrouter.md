---
read_when:
    - تريد مفتاحًا واحدًا لواجهة برمجة التطبيقات للعديد من نماذج اللغة الكبيرة
    - تريد تشغيل النماذج عبر OpenRouter في OpenClaw
    - تريد استخدام OpenRouter لتوليد الصور
    - تريد استخدام OpenRouter لتوليد الفيديو
summary: استخدم واجهة API الموحدة الخاصة بـ OpenRouter للوصول إلى العديد من النماذج في OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-02T21:01:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: e98b8b540265b6d11681390c02cb68312f33625bf223823a2dbca17e877c0422
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter يوفر **واجهة API موحدة** توجّه الطلبات إلى العديد من النماذج خلف نقطة نهاية واحدة ومفتاح API واحد. وهو متوافق مع OpenAI، لذلك تعمل معظم SDKs الخاصة بـ OpenAI عبر تبديل عنوان URL الأساسي.

## البدء

<Steps>
  <Step title="Get your API key">
    أنشئ مفتاح API في [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Optional) Switch to a specific model">
    يستخدم الإعداد التمهيدي `openrouter/auto` افتراضياً. اختر نموذجاً محدداً لاحقاً:

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

أمثلة fallback المضمنة:

| مرجع النموذج                    | ملاحظات                         |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | توجيه OpenRouter التلقائي |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 عبر MoonshotAI     |

## توليد الصور

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

يرسل OpenClaw طلبات الصور إلى API صور إكمالات المحادثة في OpenRouter مع `modalities: ["image", "text"]`. تتلقى نماذج الصور من Gemini تلميحات `aspectRatio` و`resolution` المدعومة عبر `image_config` في OpenRouter. استخدم `agents.defaults.imageGenerationModel.timeoutMs` لنماذج صور OpenRouter الأبطأ؛ وتبقى معلمة `timeoutMs` لكل استدعاء في أداة `image_generate` هي صاحبة الأولوية.

## توليد الفيديو

يمكن أن يدعم OpenRouter أيضاً أداة `video_generate` عبر API غير المتزامنة `/videos`. استخدم نموذج فيديو من OpenRouter ضمن `agents.defaults.videoGenerationModel`:

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
`polling_url` المُعاد، وينزّل الفيديو المكتمل من
`unsigned_urls` في OpenRouter أو من نقطة نهاية محتوى المهمة الموثقة.
تُرسل الصور المرجعية افتراضياً كصور للإطار الأول/الأخير؛ وتُرسل الصور
الموسومة بـ `reference_image` كمراجع إدخال في OpenRouter. يعلن الإعداد الافتراضي
المضمن `google/veo-3.1-fast` عن مدد 4/6/8
ثوانٍ المدعومة حالياً، ودقات `720P`/`1080P`، ونسب أبعاد
`16:9`/`9:16`. لا يتم تسجيل تحويل الفيديو إلى فيديو لـ OpenRouter لأن API
توليد الفيديو upstream تقبل حالياً مراجع النصوص والصور.

## تحويل النص إلى كلام

يمكن أيضاً استخدام OpenRouter كموفر TTS عبر نقطة النهاية المتوافقة مع OpenAI
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

إذا تم حذف `messages.tts.providers.openrouter.apiKey`، يعيد TTS استخدام
`models.providers.openrouter.apiKey`، ثم `OPENROUTER_API_KEY`.

## المصادقة والرؤوس

يستخدم OpenRouter رمز Bearer مع مفتاح API الخاص بك داخلياً.

في طلبات OpenRouter الحقيقية (`https://openrouter.ai/api/v1`)، يضيف OpenClaw أيضاً
رؤوس إسناد التطبيق الموثقة لدى OpenRouter:

| الرأس                    | القيمة                 |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
إذا أعدت توجيه موفر OpenRouter إلى وكيل أو عنوان URL أساسي آخر، فإن OpenClaw
**لا** يحقن تلك الرؤوس الخاصة بـ OpenRouter أو علامات ذاكرة التخزين المؤقت الخاصة بـ Anthropic.
</Warning>

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="Anthropic cache markers">
    في مسارات OpenRouter المتحقق منها، تحتفظ مراجع نماذج Anthropic بعلامات
    `cache_control` الخاصة بـ Anthropic في OpenRouter التي يستخدمها OpenClaw
    لتحسين إعادة استخدام ذاكرة prompt-cache في كتل موجهات النظام/المطور.
  </Accordion>

  <Accordion title="Anthropic reasoning prefill">
    في مسارات OpenRouter المتحقق منها، تُسقط مراجع نماذج Anthropic التي تم تمكين reasoning لها
    أدوار الملء المسبق اللاحقة للمساعد قبل أن يصل الطلب إلى OpenRouter،
    بما يطابق متطلب Anthropic بأن تنتهي محادثات reasoning بدور مستخدم.
  </Accordion>

  <Accordion title="Thinking / reasoning injection">
    في المسارات المدعومة غير `auto`، يربط OpenClaw مستوى التفكير المحدد
    بحمولات reasoning الخاصة بوكيل OpenRouter. تتخطى تلميحات النماذج غير المدعومة و
    `openrouter/auto` حقن reasoning ذلك. كما يتخطى Hunter Alpha أيضاً
    reasoning الوكيل لمراجع النماذج المكونة القديمة لأن OpenRouter قد
    يعيد نص الإجابة النهائي في حقول reasoning لذلك المسار المتقاعد.
  </Accordion>

  <Accordion title="DeepSeek V4 reasoning replay">
    في مسارات OpenRouter المتحقق منها، يملأ `openrouter/deepseek/deepseek-v4-flash` و
    `openrouter/deepseek/deepseek-v4-pro` قيمة `reasoning_content` المفقودة في
    أدوار المساعد المعاد تشغيلها بحيث تحافظ محادثات التفكير/الأدوات على
    شكل المتابعة المطلوب في DeepSeek V4.
  </Accordion>

  <Accordion title="OpenAI-only request shaping">
    لا يزال OpenRouter يعمل عبر المسار المتوافق مع OpenAI بنمط الوكيل، لذلك
    لا يتم تمرير تشكيل الطلبات الأصلي الخاص بـ OpenAI فقط مثل `serviceTier`، و`store` في Responses،
    وحمولات توافق reasoning في OpenAI، وتلميحات prompt-cache.
  </Accordion>

  <Accordion title="Gemini-backed routes">
    تبقى مراجع OpenRouter المدعومة من Gemini على مسار proxy-Gemini: يحافظ OpenClaw على
    تنظيف توقيعات التفكير الخاصة بـ Gemini هناك، لكنه لا يفعّل تحقق replay الأصلي في Gemini
    أو إعادة كتابة bootstrap.
  </Accordion>

  <Accordion title="Provider routing metadata">
    إذا مرّرت توجيه موفر OpenRouter ضمن معلمات النموذج، يمرره OpenClaw
    كبيانات تعريف توجيه OpenRouter قبل تشغيل مغلفات البث المشتركة.
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="Model selection" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفرين ومراجع النماذج وسلوك failover.
  </Card>
  <Card title="Configuration reference" href="/ar/gateway/configuration-reference" icon="gear">
    مرجع الإعداد الكامل للوكلاء والنماذج والموفرين.
  </Card>
</CardGroup>
