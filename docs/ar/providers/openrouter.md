---
read_when:
    - تريد مفتاح واجهة برمجة تطبيقات واحدًا للعديد من نماذج اللغة الكبيرة
    - تريد تشغيل النماذج عبر OpenRouter في OpenClaw
    - تريد استخدام OpenRouter لتوليد الصور
    - تريد استخدام OpenRouter لتوليد الفيديو
summary: استخدم واجهة API الموحّدة الخاصة بـ OpenRouter للوصول إلى العديد من النماذج في OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-12T08:46:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0dbf2b5a69636eb18471dd7d1dcf05ee30da931e2e3b5c9ae5d44a20d3e46f78
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter يوفر **واجهة API موحدة** توجه الطلبات إلى نماذج عديدة خلف نقطة نهاية واحدة
ومفتاح API واحد. وهو متوافق مع OpenAI، لذلك تعمل معظم حزم SDK الخاصة بـ OpenAI عبر تبديل عنوان URL الأساسي.

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

| مرجع النموذج                    | ملاحظات                      |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | توجيه OpenRouter التلقائي |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 عبر MoonshotAI     |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 عبر MoonshotAI     |

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

يرسل OpenClaw طلبات الصور إلى واجهة API الخاصة بإكمالات الدردشة للصور في OpenRouter مع `modalities: ["image", "text"]`. تتلقى نماذج صور Gemini تلميحات `aspectRatio` و`resolution` المدعومة عبر `image_config` في OpenRouter. استخدم `agents.defaults.imageGenerationModel.timeoutMs` لنماذج صور OpenRouter الأبطأ؛ ولا تزال معلمة `timeoutMs` لكل استدعاء في أداة `image_generate` هي التي تكون لها الأولوية.

## توليد الفيديو

يمكن لـ OpenRouter أيضًا دعم أداة `video_generate` عبر واجهة API غير المتزامنة `/videos` الخاصة به. استخدم نموذج فيديو من OpenRouter ضمن `agents.defaults.videoGenerationModel`:

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
الموسومة بـ `reference_image` كمراجع إدخال لـ OpenRouter. يعلن الإعداد الافتراضي
المضمّن `google/veo-3.1-fast` عن مدد الثواني 4/6/8 المدعومة حاليًا،
ودقات `720P`/`1080P`، ونسب العرض إلى الارتفاع `16:9`/`9:16`.
تحويل الفيديو إلى فيديو غير مسجل لـ OpenRouter لأن واجهة API العليا
لتوليد الفيديو تقبل حاليًا النصوص ومراجع الصور.

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

إذا حُذف `messages.tts.providers.openrouter.apiKey`، يعيد TTS استخدام
`models.providers.openrouter.apiKey`، ثم `OPENROUTER_API_KEY`.

## تحويل الكلام إلى نص (الصوت الوارد)

يمكن لـ OpenRouter نسخ مرفقات الصوت/الصوتيات الواردة عبر مسار
`tools.media.audio` المشترك باستخدام نقطة نهاية STT الخاصة به (`/audio/transcriptions`).
ينطبق هذا على أي Plugin قناة يمرر الصوت/الصوتيات الواردة إلى
الفحص المسبق لفهم الوسائط.

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "openrouter", model: "openai/whisper-large-v3-turbo" }],
      },
    },
  },
}
```

يرسل OpenClaw طلبات STT إلى OpenRouter بصيغة JSON مع صوت base64 ضمن
`input_audio` (عقد STT الخاص بـ OpenRouter)، وليس كتحميلات نماذج OpenAI متعددة الأجزاء.

## المصادقة والترويسات

يستخدم OpenRouter رمز Bearer مع مفتاح API الخاص بك داخليًا.

في طلبات OpenRouter الحقيقية (`https://openrouter.ai/api/v1`)، يضيف OpenClaw أيضًا
ترويسات إسناد التطبيق الموثقة من OpenRouter:

| الترويسة                    | القيمة                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
إذا أعدت توجيه موفر OpenRouter إلى وكيل أو عنوان URL أساسي آخر، فإن OpenClaw
**لا** يحقن تلك الترويسات الخاصة بـ OpenRouter أو علامات ذاكرة التخزين المؤقت الخاصة بـ Anthropic.
</Warning>

## الإعدادات المتقدمة

<AccordionGroup>
  <Accordion title="التخزين المؤقت للاستجابات">
    التخزين المؤقت لاستجابات OpenRouter اختياري. فعّله لكل نموذج OpenRouter باستخدام
    معلمات النموذج:

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

    يرسل OpenClaw `X-OpenRouter-Cache: true`، وعند تهيئته،
    `X-OpenRouter-Cache-TTL`. يجبر `responseCacheClear: true` تحديثًا
    للطلب الحالي ويخزن الاستجابة البديلة. تُقبل أيضًا الأسماء المستعارة بصيغة snake_case
    (`response_cache` و`response_cache_ttl_seconds` و
    `response_cache_clear`).

    هذا منفصل عن التخزين المؤقت للمطالبات لدى الموفر وعن علامات
    `cache_control` الخاصة بـ Anthropic في OpenRouter. لا يُطبق إلا على مسارات
    `openrouter.ai` المتحقق منها، وليس على عناوين URL الأساسية لوكلاء مخصصين.

  </Accordion>

  <Accordion title="علامات ذاكرة التخزين المؤقت Anthropic">
    في مسارات OpenRouter المتحقق منها، تحتفظ مراجع نماذج Anthropic بعلامات
    `cache_control` الخاصة بـ Anthropic في OpenRouter التي يستخدمها OpenClaw
    لتحسين إعادة استخدام ذاكرة التخزين المؤقت للمطالبات في كتل مطالبات النظام/المطور.
  </Accordion>

  <Accordion title="ملء مسبق للاستدلال في Anthropic">
    في مسارات OpenRouter المتحقق منها، تُسقط مراجع نماذج Anthropic التي تم تمكين الاستدلال لها
    أدوار الملء المسبق للمساعد اللاحقة قبل أن يصل الطلب إلى OpenRouter،
    بما يطابق متطلب Anthropic بأن تنتهي محادثات الاستدلال بدور مستخدم.
  </Accordion>

  <Accordion title="حقن التفكير / الاستدلال">
    في المسارات المدعومة غير `auto`، يطابق OpenClaw مستوى التفكير المحدد مع
    حمولات استدلال وكيل OpenRouter. تتجاوز تلميحات النماذج غير المدعومة و
    `openrouter/auto` حقن الاستدلال هذا. يتجاوز Hunter Alpha أيضًا
    استدلال الوكيل لمراجع النماذج القديمة المهيأة لأن OpenRouter قد
    يعيد نص الإجابة النهائي في حقول الاستدلال لذلك المسار المتقاعد.
  </Accordion>

  <Accordion title="إعادة تشغيل استدلال DeepSeek V4">
    في مسارات OpenRouter المتحقق منها، يملأ `openrouter/deepseek/deepseek-v4-flash` و
    `openrouter/deepseek/deepseek-v4-pro` قيمة `reasoning_content` المفقودة في
    أدوار المساعد المعاد تشغيلها حتى تحافظ محادثات التفكير/الأدوات على
    شكل المتابعة المطلوب من DeepSeek V4. يرسل OpenClaw قيم
    `reasoning_effort` المدعومة من OpenRouter لهذه المسارات؛ و`xhigh` هو أعلى مستوى معلن،
    وتُطابق تجاوزات `max` القديمة مع `xhigh`.
  </Accordion>

  <Accordion title="تشكيل الطلبات الخاصة بـ OpenAI فقط">
    لا يزال OpenRouter يعمل عبر المسار المتوافق مع OpenAI بنمط الوكيل، لذلك
    لا يُمرر تشكيل الطلبات الأصلي الخاص بـ OpenAI فقط مثل `serviceTier` وResponses `store`
    وحمولات توافق استدلال OpenAI وتلميحات ذاكرة التخزين المؤقت للمطالبات.
  </Accordion>

  <Accordion title="المسارات المدعومة بـ Gemini">
    تبقى مراجع OpenRouter المدعومة بـ Gemini على مسار proxy-Gemini: يحتفظ OpenClaw
    بتنظيف توقيع التفكير الخاص بـ Gemini هناك، لكنه لا يمكّن تحقق إعادة التشغيل الأصلي من Gemini
    أو إعادة كتابة التمهيد.
  </Accordion>

  <Accordion title="بيانات تعريف توجيه الموفر">
    إذا مررت توجيه موفر OpenRouter ضمن معلمات النموذج، يمرره OpenClaw
    كبيانات تعريف لتوجيه OpenRouter قبل تشغيل أغلفة البث المشتركة.
  </Accordion>
</AccordionGroup>

## ذات صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفرين ومراجع النماذج وسلوك الانتقال عند الفشل.
  </Card>
  <Card title="مرجع الإعدادات" href="/ar/gateway/configuration-reference" icon="gear">
    مرجع الإعدادات الكامل للوكلاء والنماذج والموفرين.
  </Card>
</CardGroup>
