---
read_when:
    - تريد مفتاح واجهة برمجة تطبيقات واحدًا للعديد من نماذج اللغة الكبيرة
    - تريد تشغيل النماذج عبر OpenRouter في OpenClaw
    - تريد استخدام OpenRouter لإنشاء الصور
    - تريد استخدام OpenRouter لتوليد الفيديو
summary: استخدم واجهة برمجة التطبيقات الموحّدة من OpenRouter للوصول إلى العديد من النماذج في OpenClaw.
title: OpenRouter
x-i18n:
    generated_at: "2026-05-10T19:59:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5016c522cb2239dadebbfe63459d0e00f43b3dc76aa49cd5b4acfd542b31be71
    source_path: providers/openrouter.md
    workflow: 16
---

يوفّر OpenRouter **API موحّدًا** يوجّه الطلبات إلى نماذج كثيرة خلف
نقطة نهاية واحدة ومفتاح API واحد. وهو متوافق مع OpenAI، لذلك تعمل معظم حزم SDK الخاصة بـ OpenAI عبر تبديل عنوان URL الأساسي.

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
للمزوّدين والنماذج المتاحة، راجع [/concepts/model-providers](/ar/concepts/model-providers).
</Note>

أمثلة الاحتياط المضمّنة:

| مرجع النموذج                     | ملاحظات                       |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | توجيه OpenRouter التلقائي |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 عبر MoonshotAI     |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 عبر MoonshotAI     |

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

يرسل OpenClaw طلبات الصور إلى API صور إكمالات الدردشة الخاص بـ OpenRouter مع `modalities: ["image", "text"]`. تتلقى نماذج صور Gemini تلميحات `aspectRatio` و`resolution` المدعومة عبر `image_config` الخاص بـ OpenRouter. استخدم `agents.defaults.imageGenerationModel.timeoutMs` لنماذج صور OpenRouter الأبطأ؛ وما يزال معامل `timeoutMs` لكل استدعاء في أداة `image_generate` هو صاحب الأولوية.

## توليد الفيديو

يمكن أن يدعم OpenRouter أيضًا أداة `video_generate` عبر API `/videos` غير المتزامن الخاص به. استخدم نموذج فيديو من OpenRouter ضمن `agents.defaults.videoGenerationModel`:

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
`polling_url` المعاد، ثم ينزّل الفيديو المكتمل من
`unsigned_urls` الخاصة بـ OpenRouter أو من نقطة نهاية محتوى المهمة الموثّقة.
تُرسل الصور المرجعية افتراضيًا كصور للإطار الأول/الأخير؛ أما الصور
الموسومة بـ `reference_image` فتُرسل كمراجع إدخال إلى OpenRouter. يعلن الإعداد الافتراضي
المضمّن `google/veo-3.1-fast` عن مدد 4/6/8
ثوانٍ المدعومة حاليًا، ودقات `720P`/`1080P`، ونسب العرض إلى الارتفاع `16:9`/`9:16`.
لا يُسجّل تحويل الفيديو إلى فيديو لـ OpenRouter لأن API توليد الفيديو في المصدر الأعلى
يقبل حاليًا مراجع النصوص والصور.

## تحويل النص إلى كلام

يمكن أيضًا استخدام OpenRouter كمزوّد TTS عبر نقطة النهاية
`/audio/speech` المتوافقة مع OpenAI.

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

إذا حُذف `messages.tts.providers.openrouter.apiKey`، يعيد TTS استخدام
`models.providers.openrouter.apiKey`، ثم `OPENROUTER_API_KEY`.

## المصادقة والترويسات

يستخدم OpenRouter رمز Bearer مع مفتاح API الخاص بك داخليًا.

في طلبات OpenRouter الحقيقية (`https://openrouter.ai/api/v1`)، يضيف OpenClaw أيضًا
ترويسات نسب التطبيق الموثّقة الخاصة بـ OpenRouter:

| الترويسة                  | القيمة                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
إذا أعدت توجيه مزوّد OpenRouter إلى وكيل آخر أو عنوان URL أساسي آخر، فإن OpenClaw
**لا** يحقن تلك الترويسات الخاصة بـ OpenRouter أو علامات ذاكرة التخزين المؤقت الخاصة بـ Anthropic.
</Warning>

## إعدادات متقدمة

<AccordionGroup>
  <Accordion title="التخزين المؤقت للاستجابة">
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

    يرسل OpenClaw `X-OpenRouter-Cache: true`، وعند ضبطه،
    `X-OpenRouter-Cache-TTL`. يفرض `responseCacheClear: true` تحديثًا للطلب الحالي
    ويخزّن الاستجابة البديلة. كما تُقبل الأسماء المستعارة بصيغة snake_case
    (`response_cache` و`response_cache_ttl_seconds` و
    `response_cache_clear`).

    هذا منفصل عن التخزين المؤقت لمطالبات المزوّد وعن علامات
    `cache_control` الخاصة بـ Anthropic في OpenRouter. ولا يُطبّق إلا على مسارات
    `openrouter.ai` المتحقَّق منها، وليس عناوين URL الأساسية للوكلاء المخصصين.

  </Accordion>

  <Accordion title="علامات التخزين المؤقت الخاصة بـ Anthropic">
    على مسارات OpenRouter المتحقَّق منها، تحتفظ مراجع نماذج Anthropic
    بعلامات `cache_control` الخاصة بـ Anthropic في OpenRouter التي يستخدمها OpenClaw
    لتحسين إعادة استخدام ذاكرة التخزين المؤقت للمطالبات في كتل مطالبات النظام/المطوّر.
  </Accordion>

  <Accordion title="الملء المسبق للاستدلال في Anthropic">
    على مسارات OpenRouter المتحقَّق منها، تُسقط مراجع نماذج Anthropic التي يكون الاستدلال مفعّلًا لها
    أدوار الملء المسبق اللاحقة للمساعد قبل أن يصل الطلب إلى OpenRouter،
    بما يطابق متطلب Anthropic بأن تنتهي محادثات الاستدلال بدور للمستخدم.
  </Accordion>

  <Accordion title="حقن التفكير / الاستدلال">
    على المسارات المدعومة غير `auto`، يربط OpenClaw مستوى التفكير المحدد
    بحمولات الاستدلال الوكيلة في OpenRouter. تتجاوز تلميحات النماذج غير المدعومة و
    `openrouter/auto` حقن الاستدلال هذا. يتجاوز Hunter Alpha أيضًا
    استدلال الوكيل لمراجع النماذج المضبوطة القديمة لأن OpenRouter قد
    يعيد نص الإجابة النهائية في حقول الاستدلال لذلك المسار المتقاعد.
  </Accordion>

  <Accordion title="إعادة تشغيل استدلال DeepSeek V4">
    على مسارات OpenRouter المتحقَّق منها، يملأ `openrouter/deepseek/deepseek-v4-flash` و
    `openrouter/deepseek/deepseek-v4-pro` قيم `reasoning_content` المفقودة في
    أدوار المساعد المعاد تشغيلها بحيث تحافظ محادثات التفكير/الأدوات على الشكل اللاحق
    المطلوب لـ DeepSeek V4. يرسل OpenClaw قيم
    `reasoning_effort` المدعومة من OpenRouter لهذه المسارات؛ `xhigh` هو أعلى مستوى معلن،
    وتُربط تجاوزات `max` القديمة بـ `xhigh`.
  </Accordion>

  <Accordion title="تشكيل الطلبات الخاصة بـ OpenAI فقط">
    ما يزال OpenRouter يعمل عبر المسار الوكيل المتوافق مع OpenAI، لذلك
    لا تُمرَّر عمليات تشكيل الطلبات الأصلية الخاصة بـ OpenAI فقط مثل `serviceTier`، و`store` الخاصة بـ Responses،
    وحمولات توافق الاستدلال في OpenAI، وتلميحات ذاكرة التخزين المؤقت للمطالبات.
  </Accordion>

  <Accordion title="المسارات المدعومة بـ Gemini">
    تبقى مراجع OpenRouter المدعومة بـ Gemini على مسار proxy-Gemini: يحتفظ OpenClaw
    بتنقية توقيعات التفكير في Gemini هناك، لكنه لا يفعّل التحقق الأصلي من إعادة التشغيل في Gemini
    أو عمليات إعادة كتابة التمهيد.
  </Accordion>

  <Accordion title="بيانات تعريف توجيه المزوّد">
    إذا مرّرت توجيه مزوّد OpenRouter ضمن معاملات النموذج، يمرّره OpenClaw
    كبيانات تعريف توجيه OpenRouter قبل تشغيل مغلّفات البث المشتركة.
  </Accordion>
</AccordionGroup>

## ذات صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك تجاوز الفشل.
  </Card>
  <Card title="مرجع الإعدادات" href="/ar/gateway/configuration-reference" icon="gear">
    مرجع الإعدادات الكامل للوكلاء، والنماذج، والمزوّدين.
  </Card>
</CardGroup>
