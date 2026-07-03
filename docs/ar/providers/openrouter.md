---
read_when:
    - تريد مفتاح API واحدًا للعديد من نماذج LLMs
    - تريد تشغيل النماذج عبر OpenRouter في OpenClaw
    - تريد استخدام OpenRouter لتوليد الصور
    - تريد استخدام OpenRouter لتوليد الموسيقى
    - تريد استخدام OpenRouter لإنشاء الفيديو
summary: استخدم واجهة API الموحّدة من OpenRouter للوصول إلى العديد من النماذج في OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-07-03T09:39:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca36f2a7afd35ea4d276f61ded28524aed7d15715b29eea9aaac0ac6e4abab40
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter يوفّر **API موحّدة** توجّه الطلبات إلى نماذج كثيرة خلف نقطة نهاية ومفتاح API واحدين. وهو متوافق مع OpenAI، لذلك تعمل معظم حِزم OpenAI SDK عبر تبديل عنوان URL الأساسي.

## البدء

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="تشغيل إعداد OAuth">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        يفتح OpenClaw مسار تسجيل الدخول في المتصفح الخاص بـ OpenRouter، ويستبدل رمز PKCE
        بمفتاح OpenRouter API، ويحفظ ذلك المفتاح في ملف تعريف المصادقة الافتراضي
        لـ OpenRouter. على المضيفات البعيدة/بلا واجهة، يطبع OpenClaw
        عنوان URL لتسجيل الدخول ويطلب منك لصق عنوان URL لإعادة التوجيه بعد تسجيل الدخول.
      </Step>
      <Step title="(اختياري) التبديل إلى نموذج محدد">
        الإعداد الافتراضي أثناء التجهيز هو `openrouter/auto`. اختر نموذجًا محددًا لاحقًا:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
  <Tab title="مفتاح API">
    <Steps>
      <Step title="الحصول على مفتاح API الخاص بك">
        أنشئ مفتاح API في [openrouter.ai/keys](https://openrouter.ai/keys).
      </Step>
      <Step title="تشغيل الإعداد باستخدام مفتاح API">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="(اختياري) التبديل إلى نموذج محدد">
        الإعداد الافتراضي أثناء التجهيز هو `openrouter/auto`. اختر نموذجًا محددًا لاحقًا:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## مثال على الإعداد

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

أمثلة احتياطية مضمّنة:

| مرجع النموذج                      | ملاحظات                      |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | التوجيه التلقائي في OpenRouter |
| `openrouter/openrouter/fusion`    | موجّه OpenRouter Fusion      |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 عبر MoonshotAI     |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 عبر MoonshotAI     |

## إنشاء الصور

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

يرسل OpenClaw طلبات الصور إلى API صور إكمالات الدردشة الخاصة بـ OpenRouter مع `modalities: ["image", "text"]`. تتلقى نماذج صور Gemini تلميحات `aspectRatio` و`resolution` المدعومة عبر `image_config` في OpenRouter. استخدم `agents.defaults.imageGenerationModel.timeoutMs` لنماذج صور OpenRouter الأبطأ؛ وما زال معامل `timeoutMs` لكل استدعاء في أداة `image_generate` هو الذي تكون له الأولوية.

## إنشاء الفيديو

يمكن لـ OpenRouter أيضًا دعم أداة `video_generate` عبر API `/videos` غير المتزامنة الخاصة به. استخدم نموذج فيديو من OpenRouter ضمن `agents.defaults.videoGenerationModel`:

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

يرسل OpenClaw مهام تحويل النص إلى فيديو والصورة إلى فيديو إلى OpenRouter، ويستطلع
`polling_url` المُعاد، وينزّل الفيديو المكتمل من
`unsigned_urls` الخاصة بـ OpenRouter أو من نقطة نهاية محتوى المهمة الموثّقة.
تُرسل الصور المرجعية افتراضيًا كصور للإطار الأول/الأخير؛ وتُرسل الصور
الموسومة بـ `reference_image` كمراجع إدخال في OpenRouter. يعلن الإعداد الافتراضي
المضمّن `google/veo-3.1-fast` عن مدد 4/6/8
ثوانٍ المدعومة حاليًا، ودقات `720P`/`1080P`، ونسب العرض إلى الارتفاع
`16:9`/`9:16`. تحويل الفيديو إلى فيديو غير مسجّل لـ OpenRouter لأن API
إنشاء الفيديو في المصدر الأعلى تقبل حاليًا مراجع النصوص والصور.

## إنشاء الموسيقى

يمكن لـ OpenRouter أيضًا دعم أداة `music_generate` عبر
مخرجات الصوت في إكمالات الدردشة. استخدم نموذج صوت من OpenRouter ضمن
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

يتجه مزوّد موسيقى OpenRouter المضمّن افتراضيًا إلى
`google/lyria-3-pro-preview` ويعرض أيضًا
`google/lyria-3-clip-preview`. يرسل OpenClaw `modalities: ["text",
"audio"]`، ويفعّل البث، ويجمع مقاطع الصوت المتدفقة، ويحفظ
النتيجة كوسائط مُنشأة لتسليمها عبر القنوات. تُقبل الصور المرجعية
لنماذج Lyria عبر معامل `music_generate image=...` المشترك.

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
          speakerVoice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

إذا حُذف `messages.tts.providers.openrouter.apiKey`، فستعيد TTS استخدام
`models.providers.openrouter.apiKey`، ثم `OPENROUTER_API_KEY`.

## تحويل الكلام إلى نص (الصوت الوارد)

يمكن لـ OpenRouter نسخ مرفقات الصوت/الصوت الواردة من خلال مسار
`tools.media.audio` المشترك باستخدام نقطة نهاية STT الخاصة به (`/audio/transcriptions`).
ينطبق هذا على أي Plugin قناة يمرر الصوت/الصوت الوارد إلى
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

يرسل OpenClaw طلبات OpenRouter STT بصيغة JSON مع صوت base64 ضمن
`input_audio` (عقد OpenRouter STT)، وليس كعمليات رفع نماذج OpenAI متعددة الأجزاء.

## موجّه Fusion

استخدم OpenRouter Fusion عندما تريد من مرجع نموذج واحد في OpenClaw أن يطلب من عدة
نماذج OpenRouter بالتوازي، وأن يجعل OpenRouter يحكم على إجاباتها، ثم يعيد
استجابة نهائية واحدة عبر نقطة نهاية موفر OpenRouter العادية. لأن
معرّف النموذج العلوي هو `openrouter/fusion`، يتضمن مرجع نموذج OpenClaw
كلًا من بادئة موفر OpenClaw ومساحة أسماء OpenRouter العلوية:

```bash
openclaw models set openrouter/openrouter/fusion
```

اضبط لوحة Fusion والحَكَم من خلال `params.extraBody` الخاصة بالنموذج. تُمرَّر هذه
الحقول إلى جسم طلب إكمالات المحادثة في OpenRouter. يعمل Fusion
مع إعداد OpenRouter عبر OAuth أو إعداد مفتاح API؛ إذا استخدمت
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

قائمة `analysis_models` هي اللوحة المتوازية، و`model` داخل إعدادات
Plugin Fusion هو نموذج الحَكَم. لا تضبط `tool_choice` على المستوى الأعلى إلى
`"required"` في دورات وكيل/محادثة OpenClaw العادية لمحاولة فرض Fusion؛
قد تتضمن دورات OpenClaw تعريفات أدوات OpenClaw، ويمكن لاختيار
أداة مطلوب على المستوى الأعلى أن يتطلب واحدة من تلك الأدوات بدلًا من موجّه Fusion. عند
وجود إعدادات Plugin Fusion هذه، يضيف OpenClaw أيضًا ملاحظة مهيأة
في موجّه النظام تتضمن نماذج التحليل ونموذج الحَكَم المضبوطة حتى يتمكن
الوكيل من الإجابة عن الأسئلة حول لوحة Fusion الحالية لديه. لا تُنسخ حقول `extraBody`
الأخرى إلى الموجّه.

Fusion أبطأ بحكم التصميم. قد يرسل OpenRouter موجّه OpenClaw نفسه إلى
عدة نماذج تحليل ثم يشغّل خطوة حكم/توليف نهائية، لذلك يكون زمن الاستجابة
عادةً أعلى من طلب مباشر إلى نموذج واحد. استخدم Fusion للإجابات المتأنية
عالية الجودة أو مسارات التصعيد، وليس كخيار افتراضي للمحادثات
الحساسة لزمن الاستجابة. للحصول على استجابات أسرع، أبقِ اللوحة صغيرة واختر
نماذج تحليل وحكم أسرع.

اختبر المرجع المضبوط باستدعاء نموذج محلي لمرة واحدة:

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## المصادقة والترويسات

يستخدم OpenRouter رمز Bearer مع مفتاح API الخاص بك ضمنيًا. OpenRouter
OAuth هو تدفق تسجيل دخول PKCE يصدر مفتاح API من OpenRouter، لذلك يخزن OpenClaw
الناتج كملف تعريف مصادقة مفتاح API نفسه `openrouter:default` المستخدم في
مسار إعداد مفتاح API اليدوي.

لتثبيت موجود، سجّل الدخول أو دوّر مفتاح OpenRouter المخزّن من دون
إعادة تشغيل الإعداد الكامل:

```bash
openclaw models auth login --provider openrouter --method oauth
```

استخدم `openclaw models auth login --provider openrouter --method api-key` عندما
تريد لصق مفتاح أنشأته يدويًا في OpenRouter.

في طلبات OpenRouter الحقيقية (`https://openrouter.ai/api/v1`)، يضيف OpenClaw أيضًا
ترويسات إسناد التطبيق الموثقة لدى OpenRouter:

| الترويسة                  | القيمة                                                                                                 |
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
  <Accordion title="Response caching">
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

    يرسل OpenClaw `X-OpenRouter-Cache: true`، وعند ضبطه،
    `X-OpenRouter-Cache-TTL`. يفرض `responseCacheClear: true` تحديثًا للطلب
    الحالي ويخزن الاستجابة البديلة. تُقبل أيضًا الأسماء المستعارة بأسلوب Snake_case
    (`response_cache` و`response_cache_ttl_seconds` و
    `response_cache_clear`).

    هذا منفصل عن التخزين المؤقت لموجّهات الموفر وعن علامات
    Anthropic `cache_control` في OpenRouter. ولا يُطبَّق إلا على مسارات
    `openrouter.ai` المتحقق منها، وليس عناوين URL الأساسية لوكلاء مخصصين.

  </Accordion>

  <Accordion title="Anthropic cache markers">
    في مسارات OpenRouter المتحقق منها، تحتفظ مراجع نماذج Anthropic
    بعلامات Anthropic `cache_control` الخاصة بـ OpenRouter التي يستخدمها OpenClaw من أجل
    إعادة استخدام أفضل لذاكرة الموجّهات المؤقتة في كتل موجّهات النظام/المطور.
  </Accordion>

  <Accordion title="الملء المسبق لاستدلال Anthropic">
    في مسارات OpenRouter المتحقق منها، تُسقِط مراجع نماذج Anthropic التي تم
    تمكين الاستدلال لها أدوار الملء المسبق اللاحقة للمساعد قبل أن يصل الطلب إلى
    OpenRouter، بما يطابق متطلب Anthropic بأن تنتهي محادثات الاستدلال بدور
    للمستخدم.
  </Accordion>

  <Accordion title="حقن التفكير / الاستدلال">
    في المسارات المدعومة غير `auto`، يربط OpenClaw مستوى التفكير المحدد
    بحمولات استدلال وكيل OpenRouter. تتخطى تلميحات النماذج غير المدعومة و
    `openrouter/auto` حقن الاستدلال هذا. يتخطى Hunter Alpha أيضًا استدلال
    الوكيل لمراجع النماذج المكوّنة القديمة، لأن OpenRouter قد يعيد نص الإجابة
    النهائية في حقول الاستدلال لذلك المسار المتقاعد.
  </Accordion>

  <Accordion title="إعادة تشغيل استدلال DeepSeek V4">
    في مسارات OpenRouter المتحقق منها، يملأ `openrouter/deepseek/deepseek-v4-flash` و
    `openrouter/deepseek/deepseek-v4-pro` قيمة `reasoning_content` المفقودة في
    أدوار المساعد المعاد تشغيلها، بحيث تحافظ محادثات التفكير/الأدوات على شكل
    المتابعة المطلوب في DeepSeek V4. يرسل OpenClaw قيم `reasoning.effort`
    المدعومة من OpenRouter لهذه المسارات؛ وتُربط المستويات الأدنى غير المتوقفة
    إلى `high`، وتُربط تجاوزات `max` القديمة إلى `xhigh`.
  </Accordion>

  <Accordion title="تشكيل الطلبات الخاصة بـ OpenAI فقط">
    لا يزال OpenRouter يعمل عبر المسار المتوافق مع OpenAI بأسلوب الوكيل، لذلك
    لا تُمرَّر تشكيلات الطلبات الأصلية الخاصة بـ OpenAI فقط مثل `serviceTier`،
    و`store` في Responses، وحمولات توافق الاستدلال في OpenAI، وتلميحات ذاكرة
    التخزين المؤقت للمطالبات.
  </Accordion>

  <Accordion title="المسارات المدعومة من Gemini">
    تبقى مراجع OpenRouter المدعومة من Gemini على مسار الوكيل-Gemini: يحتفظ
    OpenClaw هناك بتنقية توقيع التفكير في Gemini، لكنه لا يفعّل التحقق الأصلي
    لإعادة تشغيل Gemini أو إعادة كتابة التمهيد.
  </Accordion>

  <Accordion title="بيانات تعريف توجيه المزوّد">
    يدعم OpenRouter كائن طلب `provider` لتوجيه المزوّد الأساسي. كوّن سياسة
    افتراضية لجميع طلبات نماذج النص في OpenRouter باستخدام
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

    يمرّر OpenClaw ذلك الكائن إلى OpenRouter كحمولة `provider` للطلب. استخدم
    حقول snake_case الموثقة في OpenRouter، بما في ذلك `sort` و`only` و`ignore`
    و`order` و`allow_fallbacks` و`require_parameters` و`data_collection`
    و`quantizations` و`max_price` و`preferred_max_latency`
    و`preferred_min_throughput` و`zdr` و`enforce_distillable_text`.

    لا تزال معاملات كل نموذج تتجاوز كائن التوجيه على مستوى المزوّد:

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
    Anthropic أو Google أو OpenAI المباشرة، أو مسارات المزوّدين المخصصة،
    معاملات توجيه OpenRouter.

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك تجاوز الفشل.
  </Card>
  <Card title="مرجع التكوين" href="/ar/gateway/configuration-reference" icon="gear">
    مرجع التكوين الكامل للوكلاء، والنماذج، والمزوّدين.
  </Card>
</CardGroup>
