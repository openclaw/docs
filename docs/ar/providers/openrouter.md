---
read_when:
    - تريد مفتاح API واحدًا للعديد من النماذج اللغوية الكبيرة
    - تريد تشغيل النماذج عبر OpenRouter في OpenClaw
    - تريد استخدام OpenRouter لتوليد الصور
    - تريد استخدام OpenRouter لتوليد الفيديو
summary: استخدم واجهة API الموحدة من OpenRouter للوصول إلى العديد من النماذج في OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-05T01:50:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2876669c6fcc958ac13c19930cd23977b8ec27ae57069d9231932cc13c75244
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter يوفر **واجهة API موحّدة** توجه الطلبات إلى العديد من النماذج خلف نقطة نهاية واحدة ومفتاح API واحد. وهو متوافق مع OpenAI، لذلك تعمل معظم حزم OpenAI SDK عبر تغيير عنوان URL الأساسي.

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

## مثال الإعدادات

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

أمثلة احتياطية مضمنة:

| مرجع النموذج                     | ملاحظات                     |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | التوجيه التلقائي في OpenRouter |
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

يرسل OpenClaw طلبات الصور إلى واجهة API لصور إكمالات المحادثة في OpenRouter مع `modalities: ["image", "text"]`. تتلقى نماذج صور Gemini تلميحات `aspectRatio` و`resolution` المدعومة من خلال `image_config` في OpenRouter. استخدم `agents.defaults.imageGenerationModel.timeoutMs` لنماذج صور OpenRouter الأبطأ؛ لا يزال معامل `timeoutMs` لكل استدعاء في أداة `image_generate` هو المعتمد.

## توليد الفيديو

يمكن لـ OpenRouter أيضًا دعم أداة `video_generate` من خلال واجهة API غير المتزامنة `/videos`. استخدم نموذج فيديو من OpenRouter ضمن `agents.defaults.videoGenerationModel`:

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
تُرسل الصور المرجعية كصور للإطار الأول/الأخير افتراضيًا؛ وتُرسل الصور
الموسومة بـ `reference_image` كمراجع إدخال في OpenRouter. يعلن الإعداد الافتراضي
المضمن `google/veo-3.1-fast` عن مدد الثواني 4/6/8 المدعومة حاليًا،
ودقات `720P`/`1080P`، ونسب الأبعاد `16:9`/`9:16`.
لا يتم تسجيل تحويل الفيديو إلى فيديو لـ OpenRouter لأن واجهة API لتوليد الفيديو في المصدر
تقبل حاليًا النص ومراجع الصور.

## تحويل النص إلى كلام

يمكن أيضًا استخدام OpenRouter كموفر TTS من خلال نقطة النهاية المتوافقة مع OpenAI
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

## المصادقة والترويسات

يستخدم OpenRouter رمز Bearer مع مفتاح API الخاص بك داخليًا.

في طلبات OpenRouter الحقيقية (`https://openrouter.ai/api/v1`)، يضيف OpenClaw أيضًا
ترويسات إسناد التطبيق الموثقة لدى OpenRouter:

| الترويسة                  | القيمة                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
إذا أعدت توجيه موفر OpenRouter إلى وكيل آخر أو عنوان URL أساسي آخر، فإن OpenClaw
**لا** يحقن تلك الترويسات الخاصة بـ OpenRouter أو علامات تخزين Anthropic المؤقت.
</Warning>

## الإعدادات المتقدمة

<AccordionGroup>
  <Accordion title="تخزين الاستجابات مؤقتًا">
    تخزين استجابات OpenRouter مؤقتًا اختياري. فعّله لكل نموذج OpenRouter باستخدام
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
    `X-OpenRouter-Cache-TTL`. يفرض `responseCacheClear: true` تحديثًا
    للطلب الحالي ويخزن الاستجابة البديلة. كما تُقبل الأسماء المستعارة بصيغة Snake_case
    (`response_cache`، و`response_cache_ttl_seconds`، و
    `response_cache_clear`).

    هذا منفصل عن تخزين مطالبات الموفر مؤقتًا وعن علامات Anthropic
    `cache_control` في OpenRouter. يُطبّق فقط على مسارات
    `openrouter.ai` المتحقق منها، وليس على عناوين URL الأساسية لوكلاء مخصصين.

  </Accordion>

  <Accordion title="علامات تخزين Anthropic المؤقت">
    في مسارات OpenRouter المتحقق منها، تحتفظ مراجع نماذج Anthropic بعلامات
    Anthropic `cache_control` الخاصة بـ OpenRouter التي يستخدمها OpenClaw
    لتحسين إعادة استخدام ذاكرة المطالبات المؤقتة على كتل مطالبات النظام/المطور.
  </Accordion>

  <Accordion title="الملء المسبق لاستدلال Anthropic">
    في مسارات OpenRouter المتحقق منها، تحذف مراجع نماذج Anthropic التي فُعّل فيها الاستدلال
    أدوار الملء المسبق الأخيرة للمساعد قبل أن يصل الطلب إلى OpenRouter،
    بما يطابق متطلب Anthropic بأن تنتهي محادثات الاستدلال بدور مستخدم.
  </Accordion>

  <Accordion title="حقن التفكير / الاستدلال">
    في المسارات المدعومة غير `auto`، يطابق OpenClaw مستوى التفكير المحدد مع
    حمولات استدلال وكيل OpenRouter. تتجاوز تلميحات النماذج غير المدعومة و
    `openrouter/auto` حقن الاستدلال هذا. يتجاوز Hunter Alpha أيضًا
    استدلال الوكيل لمراجع النماذج المعدة القديمة لأن OpenRouter قد يعيد
    نص الإجابة النهائية في حقول الاستدلال لذلك المسار المتقاعد.
  </Accordion>

  <Accordion title="إعادة تشغيل استدلال DeepSeek V4">
    في مسارات OpenRouter المتحقق منها، يملأ `openrouter/deepseek/deepseek-v4-flash` و
    `openrouter/deepseek/deepseek-v4-pro` قيمة `reasoning_content` المفقودة في
    أدوار المساعد المعاد تشغيلها بحيث تحافظ محادثات التفكير/الأدوات على
    الشكل اللاحق المطلوب من DeepSeek V4. يرسل OpenClaw قيم
    `reasoning_effort` المدعومة من OpenRouter لهذه المسارات؛ `xhigh` هو أعلى
    مستوى معلن، وتُحوّل التجاوزات القديمة `max` إلى `xhigh`.
  </Accordion>

  <Accordion title="تشكيل الطلبات الخاصة بـ OpenAI فقط">
    لا يزال OpenRouter يعمل عبر المسار المتوافق مع OpenAI بأسلوب الوكيل، لذلك
    لا يتم تمرير تشكيل الطلبات الأصلي الخاص بـ OpenAI فقط مثل `serviceTier`، و`store` في Responses،
    وحمولات توافق الاستدلال مع OpenAI، وتلميحات ذاكرة المطالبات المؤقتة.
  </Accordion>

  <Accordion title="المسارات المدعومة من Gemini">
    تبقى مراجع OpenRouter المدعومة من Gemini على مسار وكيل Gemini: يحافظ OpenClaw
    على تنظيف توقيعات التفكير في Gemini هناك، لكنه لا يفعّل التحقق الأصلي من إعادة تشغيل Gemini
    أو إعادة كتابات التمهيد.
  </Accordion>

  <Accordion title="بيانات تعريف توجيه الموفر">
    إذا مررت توجيه موفر OpenRouter ضمن معاملات النموذج، يمرره OpenClaw
    كبيانات تعريف توجيه في OpenRouter قبل تشغيل أغلفة البث المشتركة.
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
