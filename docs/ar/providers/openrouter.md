---
read_when:
    - تريد مفتاح واجهة برمجة تطبيقات واحدًا للعديد من النماذج اللغوية الكبيرة
    - تريد تشغيل النماذج عبر OpenRouter في OpenClaw
    - تريد استخدام OpenRouter لتوليد الصور
    - تريد استخدام OpenRouter لتوليد الفيديو
summary: استخدم واجهة برمجة التطبيقات الموحّدة الخاصة بـ OpenRouter للوصول إلى العديد من النماذج في OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-30T08:22:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 47206ce7279eb8a38f71b5c40d34646ad01df2cac25860b629951f9cec73270f
    source_path: providers/openrouter.md
    workflow: 16
---

يوفّر OpenRouter **واجهة API موحّدة** توجّه الطلبات إلى نماذج عديدة خلف
نقطة نهاية واحدة ومفتاح API واحد. وهو متوافق مع OpenAI، لذلك تعمل معظم حِزم OpenAI SDK بتغيير عنوان URL الأساسي.

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

## مثال للإعدادات

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
تتبع مراجع النماذج النمط `openrouter/<provider>/<model>`. للاطّلاع على القائمة الكاملة
للموفّرين والنماذج المتاحة، راجع [/concepts/model-providers](/ar/concepts/model-providers).
</Note>

أمثلة احتياطية مضمنة:

| مرجع النموذج                     | ملاحظات                       |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | التوجيه التلقائي في OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 عبر MoonshotAI     |

## توليد الصور

يمكن أن يدعم OpenRouter أيضًا أداة `image_generate`. استخدم نموذج صور من OpenRouter ضمن `agents.defaults.imageGenerationModel`:

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

يرسل OpenClaw طلبات الصور إلى واجهة API صور إكمالات المحادثة في OpenRouter مع `modalities: ["image", "text"]`. تتلقى نماذج صور Gemini تلميحات `aspectRatio` و`resolution` المدعومة عبر `image_config` في OpenRouter. استخدم `agents.defaults.imageGenerationModel.timeoutMs` لنماذج صور OpenRouter الأبطأ؛ ويظل معامل `timeoutMs` لكل استدعاء في أداة `image_generate` هو صاحب الأولوية.

## توليد الفيديو

يمكن أن يدعم OpenRouter أيضًا أداة `video_generate` عبر واجهة API غير المتزامنة `/videos`. استخدم نموذج فيديو من OpenRouter ضمن `agents.defaults.videoGenerationModel`:

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

يرسل OpenClaw مهام تحويل النص إلى فيديو وتحويل الصورة إلى فيديو إلى OpenRouter، ويستعلم عن
`polling_url` المُعاد، ثم ينزّل الفيديو المكتمل من
`unsigned_urls` في OpenRouter أو من نقطة نهاية محتوى المهمة الموثقة.
تُرسل الصور المرجعية افتراضيًا كصور إطار أول/أخير؛ وتُرسل الصور
الموسومة بـ `reference_image` كمراجع إدخال في OpenRouter. يعلن الإعداد الافتراضي المضمن
`google/veo-3.1-fast` عن مدد 4/6/8
ثوانٍ المدعومة حاليًا، ودقات `720P`/`1080P`، ونِسب أبعاد `16:9`/`9:16`.
لا يُسجّل تحويل الفيديو إلى فيديو لـ OpenRouter لأن واجهة API توليد الفيديو في المصدر الأعلى
تقبل حاليًا مراجع النصوص والصور.

## تحويل النص إلى كلام

يمكن أيضًا استخدام OpenRouter كمزوّد TTS عبر نقطة النهاية المتوافقة مع OpenAI
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

## المصادقة والترويسات

يستخدم OpenRouter رمز Bearer مع مفتاح API الخاص بك داخليًا.

في طلبات OpenRouter الحقيقية (`https://openrouter.ai/api/v1`)، يضيف OpenClaw أيضًا
ترويسات إسناد التطبيق الموثقة في OpenRouter:

| الترويسة                  | القيمة                |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
إذا أعدت توجيه موفّر OpenRouter إلى وكيل آخر أو عنوان URL أساسي آخر، فلن يحقن OpenClaw
تلك الترويسات الخاصة بـ OpenRouter أو علامات ذاكرة التخزين المؤقت الخاصة بـ Anthropic.
</Warning>

## إعدادات متقدمة

<AccordionGroup>
  <Accordion title="علامات ذاكرة التخزين المؤقت في Anthropic">
    على مسارات OpenRouter التي تم التحقق منها، تحتفظ مراجع نماذج Anthropic
    بعلامات `cache_control` الخاصة بـ Anthropic في OpenRouter التي يستخدمها OpenClaw من أجل
    إعادة استخدام ذاكرة التخزين المؤقت للمطالبات بشكل أفضل في كتل مطالبات النظام/المطوّر.
  </Accordion>

  <Accordion title="حقن التفكير / الاستدلال">
    على المسارات المدعومة غير `auto`، يربط OpenClaw مستوى التفكير المحدد
    بحمولات استدلال وكيل OpenRouter. تتخطى تلميحات النماذج غير المدعومة و
    `openrouter/auto` حقن الاستدلال ذلك. يتخطى Hunter Alpha أيضًا
    استدلال الوكيل لمراجع النماذج القديمة المضبوطة لأن OpenRouter قد
    يعيد نص الإجابة النهائية في حقول الاستدلال لذلك المسار المتقاعد.
  </Accordion>

  <Accordion title="تشكيل الطلبات الخاصة بـ OpenAI فقط">
    ما يزال OpenRouter يعمل عبر المسار المتوافق مع OpenAI بنمط الوكيل، لذلك
    لا يُمرَّر تشكيل الطلبات الأصلي الخاص بـ OpenAI فقط مثل `serviceTier` و`store` في Responses،
    وحمولات توافق الاستدلال في OpenAI، وتلميحات ذاكرة التخزين المؤقت للمطالبات.
  </Accordion>

  <Accordion title="مسارات مدعومة بـ Gemini">
    تبقى مراجع OpenRouter المدعومة بـ Gemini على مسار proxy-Gemini: يحافظ OpenClaw
    هناك على تنظيف تواقيع التفكير في Gemini، لكنه لا يفعّل التحقق الأصلي من إعادة التشغيل في Gemini
    أو إعادة كتابة التمهيد.
  </Accordion>

  <Accordion title="بيانات توجيه الموفّر الوصفية">
    إذا مرّرت توجيه موفّر OpenRouter ضمن معاملات النموذج، فسيعيد OpenClaw تمريره
    كبيانات وصفية لتوجيه OpenRouter قبل تشغيل مغلّفات التدفق المشتركة.
  </Accordion>
</AccordionGroup>

## ذات صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفّرين، ومراجع النماذج، وسلوك تجاوز الفشل.
  </Card>
  <Card title="مرجع الإعدادات" href="/ar/gateway/configuration-reference" icon="gear">
    المرجع الكامل لإعدادات الوكلاء، والنماذج، والموفّرين.
  </Card>
</CardGroup>
