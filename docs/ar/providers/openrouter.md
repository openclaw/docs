---
read_when:
    - تريد مفتاح واجهة برمجة تطبيقات واحدًا للعديد من نماذج اللغة الكبيرة
    - تريد تشغيل النماذج عبر OpenRouter في OpenClaw
    - تريد استخدام OpenRouter لتوليد الصور
    - تريد استخدام OpenRouter لتوليد الفيديو
summary: استخدم واجهة برمجة التطبيقات الموحدة من OpenRouter للوصول إلى العديد من النماذج في OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-02T07:41:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: f6f7c6f9c77e2a62866fdeaa65667d3871930be2ce22a638accdb8baa76220fd
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter يوفر **واجهة API موحدة** توجه الطلبات إلى العديد من النماذج خلف
نقطة نهاية واحدة ومفتاح API واحد. وهو متوافق مع OpenAI، لذا تعمل معظم حزم OpenAI SDK بمجرد تبديل عنوان URL الأساسي.

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
  <Step title="(اختياري) انتقل إلى نموذج محدد">
    يستخدم الإعداد الأولي `openrouter/auto` افتراضيًا. اختر نموذجًا محددًا لاحقًا:

    ```bash
    openclaw models set openrouter/<provider>/<model>
    ```

  </Step>
</Steps>

## مثال على الإعدادات

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

| مرجع النموذج                    | ملاحظات                       |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | توجيه OpenRouter التلقائي |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 عبر MoonshotAI     |

## توليد الصور

يمكن لـ OpenRouter أيضًا دعم أداة `image_generate`. استخدم نموذج صور من OpenRouter ضمن `agents.defaults.imageGenerationModel`:

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

يرسل OpenClaw طلبات الصور إلى واجهة API لصور إكمالات الدردشة في OpenRouter باستخدام `modalities: ["image", "text"]`. تتلقى نماذج صور Gemini تلميحات `aspectRatio` و`resolution` المدعومة عبر `image_config` الخاص بـ OpenRouter. استخدم `agents.defaults.imageGenerationModel.timeoutMs` لنماذج الصور الأبطأ في OpenRouter؛ وسيظل معامل `timeoutMs` الخاص بكل استدعاء في أداة `image_generate` هو صاحب الأولوية.

## توليد الفيديو

يمكن لـ OpenRouter أيضًا دعم أداة `video_generate` عبر واجهة API غير المتزامنة `/videos`. استخدم نموذج فيديو من OpenRouter ضمن `agents.defaults.videoGenerationModel`:

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
تُرسل الصور المرجعية كصور للإطار الأول/الأخير افتراضيًا؛ أما الصور
الموسومة بـ `reference_image` فتُرسل كمراجع إدخال في OpenRouter. يعلن
الإعداد الافتراضي المضمّن `google/veo-3.1-fast` عن مدد الثواني 4/6/8
المدعومة حاليًا، ودقات `720P`/`1080P`، ونسب العرض إلى الارتفاع
`16:9`/`9:16`. لا يتم تسجيل تحويل الفيديو إلى فيديو في OpenRouter لأن واجهة API
الأولية لتوليد الفيديو تقبل حاليًا مراجع النص والصور.

## تحويل النص إلى كلام

يمكن أيضًا استخدام OpenRouter كموفر TTS عبر نقطة النهاية المتوافقة مع OpenAI
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

إذا تم حذف `messages.tts.providers.openrouter.apiKey`، فسيعيد TTS استخدام
`models.providers.openrouter.apiKey`، ثم `OPENROUTER_API_KEY`.

## المصادقة والترويسات

يستخدم OpenRouter رمز Bearer مع مفتاح API الخاص بك داخليًا.

في طلبات OpenRouter الحقيقية (`https://openrouter.ai/api/v1`)، يضيف OpenClaw أيضًا
ترويسات إسناد التطبيق الموثقة في OpenRouter:

| الترويسة                    | القيمة                 |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
إذا أعدت توجيه موفر OpenRouter إلى وكيل آخر أو عنوان URL أساسي آخر، فإن OpenClaw
**لا** يحقن تلك الترويسات الخاصة بـ OpenRouter أو علامات ذاكرة التخزين المؤقت الخاصة بـ Anthropic.
</Warning>

## الإعدادات المتقدمة

<AccordionGroup>
  <Accordion title="علامات ذاكرة التخزين المؤقت في Anthropic">
    في مسارات OpenRouter التي تم التحقق منها، تحتفظ مراجع نماذج Anthropic
    بعلامات `cache_control` الخاصة بـ Anthropic في OpenRouter التي يستخدمها OpenClaw
    لتحسين إعادة استخدام ذاكرة التخزين المؤقت للمطالبات في كتل مطالبات النظام/المطور.
  </Accordion>

  <Accordion title="تعبئة reasoning المسبقة في Anthropic">
    في مسارات OpenRouter التي تم التحقق منها، تسقط مراجع نماذج Anthropic التي تم تفعيل reasoning لها
    أدوار تعبئة المساعد اللاحقة قبل أن يصل الطلب إلى OpenRouter،
    بما يطابق متطلب Anthropic بأن تنتهي محادثات reasoning بدور مستخدم.
  </Accordion>

  <Accordion title="حقن Thinking / reasoning">
    في المسارات المدعومة غير `auto`، يعيّن OpenClaw مستوى التفكير المحدد إلى
    حمولات reasoning الخاصة بوكيل OpenRouter. تتخطى تلميحات النماذج غير المدعومة و
    `openrouter/auto` حقن reasoning هذا. كما يتخطى Hunter Alpha
    reasoning عبر الوكيل لمراجع النماذج المضبوطة القديمة لأن OpenRouter قد
    يعيد نص الإجابة النهائية في حقول reasoning لذلك المسار المتقاعد.
  </Accordion>

  <Accordion title="تشكيل الطلبات الخاصة بـ OpenAI فقط">
    لا يزال OpenRouter يعمل عبر المسار المتوافق مع OpenAI بأسلوب الوكيل، لذلك
    لا يتم تمرير تشكيل الطلبات الأصلي الخاص بـ OpenAI فقط، مثل `serviceTier`، و`store` في Responses،
    وحمولات توافق reasoning في OpenAI، وتلميحات ذاكرة التخزين المؤقت للمطالبات.
  </Accordion>

  <Accordion title="المسارات المدعومة بـ Gemini">
    تبقى مراجع OpenRouter المدعومة بـ Gemini على مسار proxy-Gemini: يحافظ OpenClaw
    على تنظيف تواقيع التفكير الخاصة بـ Gemini هناك، لكنه لا يفعّل تحقق إعادة التشغيل الأصلي في Gemini
    أو إعادة كتابة bootstrap.
  </Accordion>

  <Accordion title="بيانات تعريف توجيه الموفر">
    إذا مررت توجيه موفر OpenRouter ضمن معاملات النموذج، فإن OpenClaw يمرره
    كبيانات تعريف توجيه OpenRouter قبل تشغيل أغلفة البث المشتركة.
  </Accordion>
</AccordionGroup>

## ذات صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفرين، ومراجع النماذج، وسلوك تجاوز الفشل.
  </Card>
  <Card title="مرجع الإعدادات" href="/ar/gateway/configuration-reference" icon="gear">
    مرجع الإعدادات الكامل للوكلاء والنماذج والموفرين.
  </Card>
</CardGroup>
