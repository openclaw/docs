---
read_when:
    - تريد مفتاح API واحدًا للعديد من نماذج اللغة الكبيرة
    - تريد تشغيل النماذج عبر OpenRouter في OpenClaw
    - تريد استخدام OpenRouter لتوليد الصور
    - تريد استخدام OpenRouter لتوليد الموسيقى
    - تريد استخدام OpenRouter لتوليد الفيديو
summary: استخدم واجهة API الموحّدة من OpenRouter للوصول إلى العديد من النماذج في OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-06-27T18:27:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40f1888d388de6f97329fc681da97d6c82eeba5d35b3861bde71ebc7c76e19e7
    source_path: providers/openrouter.md
    workflow: 16
---

يوفر OpenRouter **واجهة API موحدة** توجّه الطلبات إلى نماذج عديدة خلف
نقطة نهاية واحدة ومفتاح API واحد. وهو متوافق مع OpenAI، لذلك تعمل معظم حزم OpenAI SDK بمجرد تبديل عنوان URL الأساسي.

## البدء

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="تشغيل إعداد OAuth">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        يفتح OpenClaw تدفق تسجيل الدخول في متصفح OpenRouter، ويستبدل رمز PKCE
        بمفتاح API من OpenRouter، ثم يخزن ذلك المفتاح في ملف تعريف المصادقة
        الافتراضي لـ OpenRouter. على المضيفات البعيدة أو دون واجهة، يطبع OpenClaw
        عنوان URL لتسجيل الدخول ويطلب منك لصق عنوان URL لإعادة التوجيه بعد تسجيل الدخول.
      </Step>
      <Step title="(اختياري) التبديل إلى نموذج محدد">
        تكون قيمة الإعداد الافتراضية هي `openrouter/auto`. اختر نموذجًا محددًا لاحقًا:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
  <Tab title="مفتاح API">
    <Steps>
      <Step title="الحصول على مفتاح API">
        أنشئ مفتاح API في [openrouter.ai/keys](https://openrouter.ai/keys).
      </Step>
      <Step title="تشغيل الإعداد باستخدام مفتاح API">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="(اختياري) التبديل إلى نموذج محدد">
        تكون قيمة الإعداد الافتراضية هي `openrouter/auto`. اختر نموذجًا محددًا لاحقًا:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## مثال على التكوين

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
بالموفرين والنماذج المتاحة، راجع [/concepts/model-providers](/ar/concepts/model-providers).
</Note>

أمثلة الرجوع الاحتياطية المضمنة:

| مرجع النموذج                      | ملاحظات                       |
| --------------------------------- | ----------------------------- |
| `openrouter/auto`                 | التوجيه التلقائي من OpenRouter |
| `openrouter/openrouter/fusion`    | موجّه OpenRouter Fusion        |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 عبر MoonshotAI       |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 عبر MoonshotAI       |

## توليد الصور

يمكن أيضًا لـ OpenRouter دعم أداة `image_generate`. استخدم نموذج صور من OpenRouter ضمن `agents.defaults.imageGenerationModel`:

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

يرسل OpenClaw طلبات الصور إلى واجهة API الخاصة بصور إكمالات الدردشة في OpenRouter مع `modalities: ["image", "text"]`. تتلقى نماذج صور Gemini تلميحات `aspectRatio` و`resolution` المدعومة عبر `image_config` في OpenRouter. استخدم `agents.defaults.imageGenerationModel.timeoutMs` لنماذج صور OpenRouter الأبطأ؛ ولا يزال معامل `timeoutMs` لكل استدعاء في أداة `image_generate` هو صاحب الأولوية.

## توليد الفيديو

يمكن أيضًا لـ OpenRouter دعم أداة `video_generate` عبر واجهة API غير المتزامنة `/videos`. استخدم نموذج فيديو من OpenRouter ضمن `agents.defaults.videoGenerationModel`:

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
تُرسل الصور المرجعية كصور إطار أول/أخير افتراضيًا؛ وتُرسل الصور
الموسومة بـ `reference_image` كمراجع إدخال في OpenRouter. يعلن الإعداد
الافتراضي المضمن `google/veo-3.1-fast` مدد 4/6/8
ثوانٍ المدعومة حاليًا، ودقات `720P`/`1080P`، ونسب العرض إلى الارتفاع
`16:9`/`9:16`. لا يتم تسجيل تحويل الفيديو إلى فيديو لـ OpenRouter لأن واجهة API
العليا لتوليد الفيديو تقبل حاليًا مراجع النص والصور.

## توليد الموسيقى

يمكن أيضًا لـ OpenRouter دعم أداة `music_generate` عبر مخرجات الصوت
في إكمالات الدردشة. استخدم نموذج صوت من OpenRouter ضمن
`agents.defaults.musicGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "openrouter/google/lyria-3-pro-preview",
        timeoutMs: 180_000,
      },
    },
  },
}
```

يعتمد موفر الموسيقى المضمن في OpenRouter افتراضيًا على
`google/lyria-3-pro-preview` ويعرض أيضًا
`google/lyria-3-clip-preview`. يرسل OpenClaw `modalities: ["text",
"audio"]`، ويمكّن البث، ويجمع مقاطع الصوت المتدفقة، ويحفظ
النتيجة كوسائط مولدة لتسليمها عبر القنوات. تُقبل الصور المرجعية
لنماذج Lyria عبر معامل `music_generate image=...` المشترك.

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
          speakerVoice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

إذا تم حذف `messages.tts.providers.openrouter.apiKey`، يعيد TTS استخدام
`models.providers.openrouter.apiKey`، ثم `OPENROUTER_API_KEY`.

## تحويل الكلام إلى نص (الصوت الوارد)

يمكن لـ OpenRouter نسخ مرفقات الصوت/الصوتيات الواردة عبر مسار
`tools.media.audio` المشترك باستخدام نقطة نهاية STT الخاصة به (`/audio/transcriptions`).
ينطبق هذا على أي Plugin قناة يمرر الصوت/الصوتيات الواردة إلى
التحقق التمهيدي لفهم الوسائط.

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

يرسل OpenClaw طلبات STT إلى OpenRouter كـ JSON مع صوت base64 ضمن
`input_audio` (عقد OpenRouter STT)، وليس كتحميلات نماذج OpenAI متعددة الأجزاء.

## موجّه Fusion

استخدم OpenRouter Fusion عندما تريد أن يطلب مرجع نموذج واحد في OpenClaw من عدة
نماذج OpenRouter بالتوازي، وأن يحكم OpenRouter على إجاباتها، ثم يعيد
استجابة نهائية واحدة عبر نقطة نهاية موفر OpenRouter المعتادة. لأن
اسم النموذج العلوي هو `openrouter/fusion`، يتضمن مرجع نموذج OpenClaw
كلًا من بادئة موفر OpenClaw ومساحة أسماء OpenRouter العليا:

```bash
openclaw models set openrouter/openrouter/fusion
```

اضبط لوحة Fusion ونموذج التحكيم عبر `params.extraBody` الخاص بالنموذج. تُمرر هذه
الحقول إلى جسم طلب إكمالات الدردشة في OpenRouter. يعمل Fusion
مع إعداد OAuth من OpenRouter أو إعداد مفتاح API؛ إذا كنت تستخدم
OAuth، فاحذف سطر `env.OPENROUTER_API_KEY` من المثال أدناه.

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/openrouter/fusion" },
      models: {
        "openrouter/openrouter/fusion": {
          params: {
            extraBody: {
              plugins: [
                {
                  id: "fusion",
                  analysis_models: [
                    "google/gemini-3.5-flash",
                    "moonshotai/kimi-k2.6",
                    "deepseek/deepseek-v4-pro",
                  ],
                  model: "google/gemini-3.5-flash",
                },
              ],
            },
          },
        },
      },
    },
  },
}
```

قائمة `analysis_models` هي اللوحة المتوازية، و`model` داخل تكوين Plugin
Fusion هو نموذج التحكيم. لا تضبط `tool_choice` في المستوى الأعلى على
`"required"` في دورات وكيل/دردشة OpenClaw المعتادة لمحاولة فرض Fusion؛
قد تتضمن دورات OpenClaw تعريفات أدوات OpenClaw، ويمكن لاختيار أداة مطلوب
في المستوى الأعلى أن يتطلب إحدى تلك الأدوات بدلًا من موجّه Fusion. عند
وجود تكوين Plugin Fusion هذا، يضيف OpenClaw أيضًا ملاحظة موجه نظام
منقحة تتضمن نماذج التحليل ونموذج التحكيم المضبوطة حتى يتمكن
الوكيل من الإجابة عن أسئلة حول لوحة Fusion الحالية لديه. لا تُنسخ حقول `extraBody`
الأخرى إلى الموجه.

Fusion أبطأ بطبيعته. قد يرسل OpenRouter موجه OpenClaw نفسه إلى
عدة نماذج تحليل ثم يشغل خطوة تحكيم/تركيب نهائية، لذلك يكون زمن الاستجابة
عادة أعلى من طلب مباشر إلى نموذج واحد. استخدم Fusion للإجابات المتأنية
عالية الجودة أو مسارات التصعيد، وليس كخيار افتراضي للدردشة الحساسة
لزمن الاستجابة. للاستجابات الأسرع، أبقِ اللوحة صغيرة واختر
نماذج تحليل وتحكيم أسرع.

اختبر المرجع المضبوط باستدعاء نموذج محلي لمرة واحدة:

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## المصادقة والترويسات

يستخدم OpenRouter رمز Bearer مع مفتاح API الخاص بك في الخلفية. OAuth في OpenRouter
هو تدفق تسجيل دخول PKCE يصدر مفتاح API من OpenRouter، لذلك يخزن OpenClaw
النتيجة كملف تعريف مصادقة مفتاح API نفسه `openrouter:default` المستخدم بواسطة
مسار إعداد مفتاح API اليدوي.

لتثبيت موجود، سجّل الدخول أو دوّر مفتاح OpenRouter المخزن دون
إعادة تشغيل الإعداد الكامل:

```bash
openclaw models auth login --provider openrouter --method oauth
```

استخدم `openclaw models auth login --provider openrouter --method api-key` عندما
تريد لصق مفتاح أنشأته يدويًا في OpenRouter.

في طلبات OpenRouter الحقيقية (`https://openrouter.ai/api/v1`)، يضيف OpenClaw أيضًا
ترويسات إسناد التطبيق الموثقة لدى OpenRouter:

| الترويسة                  | القيمة                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
إذا أعدت توجيه موفر OpenRouter إلى وكيل أو عنوان URL أساسي آخر، فإن OpenClaw
لا يحقن تلك الترويسات الخاصة بـ OpenRouter أو علامات ذاكرة التخزين المؤقت Anthropic.
</Warning>

## التكوين المتقدم

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

    يرسل OpenClaw `X-OpenRouter-Cache: true`، وعند الضبط،
    `X-OpenRouter-Cache-TTL`. يفرض `responseCacheClear: true` تحديثًا للطلب
    الحالي ويخزن الاستجابة البديلة. تُقبل أيضًا الأسماء البديلة بأسلوب snake_case
    (`response_cache` و`response_cache_ttl_seconds` و
    `response_cache_clear`).

    هذا منفصل عن التخزين المؤقت لموجه الموفر وعن علامات Anthropic
    `cache_control` في OpenRouter. ولا يطبق إلا على مسارات
    `openrouter.ai` المتحقق منها، وليس عناوين URL الأساسية لوكلاء مخصصين.

  </Accordion>

  <Accordion title="علامات ذاكرة التخزين المؤقت Anthropic">
    على مسارات OpenRouter المتحقق منها، تحتفظ مراجع نماذج Anthropic
    بعلامات `cache_control` الخاصة بـ Anthropic في OpenRouter التي يستخدمها OpenClaw
    لإعادة استخدام أفضل لذاكرة تخزين الموجه المؤقتة في كتل موجهات النظام/المطور.
  </Accordion>

  <Accordion title="تعبئة مسبقة لاستدلال Anthropic">
    على مسارات OpenRouter المتحقَّق منها، تسقط مراجع نماذج Anthropic التي تم
    تمكين الاستدلال لها أدوار التعبئة المسبقة اللاحقة للمساعد قبل أن يصل الطلب
    إلى OpenRouter، بما يطابق متطلب Anthropic بأن تنتهي محادثات الاستدلال بدور
    مستخدم.
  </Accordion>

  <Accordion title="حقن التفكير / الاستدلال">
    على المسارات المدعومة غير `auto`، يربط OpenClaw مستوى التفكير المحدد
    بحمولات الاستدلال الخاصة بوسيط OpenRouter. تتجاوز تلميحات النماذج غير
    المدعومة و`openrouter/auto` حقن الاستدلال هذا. يتجاوز Hunter Alpha أيضًا
    استدلال الوسيط لمراجع النماذج المضبوطة القديمة لأن OpenRouter قد يعيد نص
    الإجابة النهائية في حقول الاستدلال لذلك المسار المتقاعد.
  </Accordion>

  <Accordion title="إعادة تشغيل استدلال DeepSeek V4">
    على مسارات OpenRouter المتحقَّق منها، يملأ
    `openrouter/deepseek/deepseek-v4-flash` و
    `openrouter/deepseek/deepseek-v4-pro` قيمة `reasoning_content` المفقودة في
    أدوار المساعد المعاد تشغيلها حتى تحتفظ محادثات التفكير/الأدوات بالشكل
    اللاحق المطلوب من DeepSeek V4. يرسل OpenClaw قيم `reasoning_effort`
    المدعومة من OpenRouter لهذه المسارات؛ `xhigh` هو أعلى مستوى معلن، ويتم ربط
    تجاوزات `max` القديمة إلى `xhigh`.
  </Accordion>

  <Accordion title="تشكيل الطلبات الخاص بـ OpenAI فقط">
    لا يزال OpenRouter يعمل عبر المسار المتوافق مع OpenAI بأسلوب الوسيط، لذلك
    لا تُمرَّر عمليات تشكيل الطلبات الأصلية الخاصة بـ OpenAI فقط مثل
    `serviceTier`، و`store` في Responses، وحمولات توافق استدلال OpenAI،
    وتلميحات ذاكرة التخزين المؤقت للمطالبات.
  </Accordion>

  <Accordion title="مسارات مدعومة من Gemini">
    تبقى مراجع OpenRouter المدعومة من Gemini على مسار الوسيط Gemini: يحافظ
    OpenClaw على تنقية توقيع التفكير في Gemini هناك، لكنه لا يفعّل التحقق من
    إعادة التشغيل الأصلية في Gemini أو عمليات إعادة كتابة التهيئة.
  </Accordion>

  <Accordion title="بيانات تعريف توجيه المزوّد">
    يدعم OpenRouter كائن طلب `provider` لتوجيه المزوّد الأساسي. اضبط سياسة
    افتراضية لكل طلبات نماذج النص في OpenRouter باستخدام
    `models.providers.openrouter.params.provider`:

    ```json5
    {
      models: {
        providers: {
          openrouter: {
            params: {
              provider: {
                sort: "latency",
                require_parameters: true,
                data_collection: "deny",
              },
            },
          },
        },
      },
    }
    ```

    يمرر OpenClaw ذلك الكائن إلى OpenRouter كحمولة الطلب `provider`. استخدم
    حقول snake_case الموثقة لدى OpenRouter، بما في ذلك `sort` و`only` و`ignore`
    و`order` و`allow_fallbacks` و`require_parameters` و`data_collection`
    و`quantizations` و`max_price` و`preferred_max_latency`
    و`preferred_min_throughput` و`zdr` و`enforce_distillable_text`.

    تظل معلمات كل نموذج تتجاوز كائن التوجيه على مستوى المزوّد:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openrouter/anthropic/claude-sonnet-4-6": {
              params: {
                provider: {
                  order: ["anthropic"],
                  allow_fallbacks: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    ينطبق هذا فقط على مسارات إكمالات الدردشة في OpenRouter. تتجاهل مسارات
    Anthropic أو Google أو OpenAI المباشرة، أو مسارات المزوّدين المخصصين،
    معلمات توجيه OpenRouter.

  </Accordion>
</AccordionGroup>

## ذات صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك تجاوز الفشل.
  </Card>
  <Card title="مرجع الإعدادات" href="/ar/gateway/configuration-reference" icon="gear">
    مرجع الإعدادات الكامل للوكلاء والنماذج والمزوّدين.
  </Card>
</CardGroup>
