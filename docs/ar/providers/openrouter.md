---
read_when:
    - تريد مفتاح API واحدًا للعديد من نماذج اللغة الكبيرة
    - تريد تشغيل النماذج عبر OpenRouter في OpenClaw
    - تريد استخدام OpenRouter لإنشاء الصور
    - تريد استخدام OpenRouter لتوليد الموسيقى
    - تريد استخدام OpenRouter لإنشاء الفيديو
summary: استخدم واجهة API الموحّدة من OpenRouter للوصول إلى نماذج عديدة في OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-07-12T06:30:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3047a4da1727db1463d77fcc566231b528e2c34cc64eccaa36827e2927cc60a7
    source_path: providers/openrouter.md
    workflow: 16
---

يوجّه OpenRouter الطلبات إلى نماذج عديدة من خلال واجهة API واحدة ومفتاح واحد. وهو
متوافق مع OpenAI، لذلك يتواصل OpenClaw معه عبر آلية النقل نفسها بنمط
`openai-completions` المستخدمة مع موفّري الوكيل الآخرين.

## بدء الاستخدام

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="تشغيل الإعداد الأولي لـ OAuth">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        يفتح OpenClaw مسار تسجيل الدخول عبر المتصفح الخاص بـ OpenRouter ‏(PKCE)، ويستبدل
        الرمز بمفتاح API لـ OpenRouter، ثم يخزّنه في ملف تعريف المصادقة الافتراضي
        لـ OpenRouter. على المضيفين البعيدين أو غير المزودين بواجهة رسومية، يطبع OpenClaw
        عنوان URL لتسجيل الدخول ويطلب منك لصق عنوان URL لإعادة التوجيه بعد تسجيل الدخول.
      </Step>
      <Step title="(اختياري) التبديل إلى نموذج محدد">
        يستخدم الإعداد الأولي `openrouter/auto` افتراضيًا. اختر نموذجًا محددًا لاحقًا:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
  <Tab title="مفتاح API">
    <Steps>
      <Step title="الحصول على مفتاح API">
        أنشئ مفتاح API على [openrouter.ai/keys](https://openrouter.ai/keys).
      </Step>
      <Step title="تشغيل الإعداد الأولي باستخدام مفتاح API">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="(اختياري) التبديل إلى نموذج محدد">
        يستخدم الإعداد الأولي `openrouter/auto` افتراضيًا. اختر نموذجًا محددًا لاحقًا:

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
للموفّرين والنماذج المتاحة، راجع [/concepts/model-providers](/ar/concepts/model-providers).
</Note>

نماذج الرجوع الاحتياطية المضمّنة، والمستخدمة عند تعذّر الاكتشاف المباشر للكتالوج:

| مرجع النموذج                      | ملاحظات                       |
| --------------------------------- | ----------------------------- |
| `openrouter/auto`                 | التوجيه التلقائي من OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 عبر MoonshotAI      |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 عبر MoonshotAI      |

يُحلّ أي مرجع آخر بصيغة `openrouter/<provider>/<model>`، بما في ذلك
`openrouter/openrouter/fusion` (راجع [موجّه Fusion](#fusion-router))،
ديناميكيًا بالاستناد إلى كتالوج النماذج المباشر في OpenRouter.

## توليد الصور

يمكن لـ OpenRouter دعم أداة `image_generate`. عيّن نموذج صور من OpenRouter
ضمن `agents.defaults.imageGenerationModel`:

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

يرسل OpenClaw طلبات الصور إلى واجهة API للصور القائمة على إكمالات المحادثة في OpenRouter مع
`modalities: ["image", "text"]`. تتلقى نماذج صور Gemini أيضًا تلميحات
`aspectRatio` و`resolution` عبر `image_config` الخاص بـ OpenRouter؛ أما نماذج
الصور الأخرى فلا تتلقاها. استخدم `agents.defaults.imageGenerationModel.timeoutMs`
للنماذج الأبطأ؛ وتظل قيمة `timeoutMs` الخاصة بكل استدعاء لأداة `image_generate` هي المقدَّمة.

## توليد الفيديو

يمكن لـ OpenRouter دعم أداة `video_generate` عبر واجهة API غير المتزامنة
`/videos`. عيّن نموذج فيديو من OpenRouter ضمن
`agents.defaults.videoGenerationModel`:

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

يرسل OpenClaw مهام تحويل النص إلى فيديو والصورة إلى فيديو، ويستطلع
`polling_url` المُعاد، ثم ينزّل الفيديو المكتمل من
`unsigned_urls` في OpenRouter أو من نقطة نهاية محتوى المهمة. تُستخدم الصور المرجعية
افتراضيًا كصور للإطار الأول/الأخير؛ أما الصور الموسومة بـ `reference_image` فتُرسل
كمراجع إدخال بدلًا من ذلك. يدعم النموذج الافتراضي المضمّن `google/veo-3.1-fast`
مددًا قدرها 4/6/8 ثوانٍ، ودقتي `720P` و`1080P`، ونسبتي عرض إلى ارتفاع
`16:9` و`9:16`. تحويل الفيديو إلى فيديو غير مدعوم: لا تقبل واجهة API المصدرية
إلا مراجع النصوص والصور.

## توليد الموسيقى

يمكن لـ OpenRouter دعم أداة `music_generate` من خلال إخراج الصوت في إكمالات
المحادثة. عيّن نموذج صوت من OpenRouter ضمن
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

يستخدم موفّر الموسيقى المضمّن في OpenRouter النموذج `google/lyria-3-pro-preview`
افتراضيًا، ويتيح أيضًا `google/lyria-3-clip-preview`. يرسل OpenClaw ‏`modalities:
["text", "audio"]`، ويبث الاستجابة، ويجمع مقاطع الصوت، ويحفظ
النتيجة كوسائط مولّدة لتسليمها عبر القناة. تقبل نماذج Lyria صورة
مرجعية واحدة من خلال المعامل المشترك `music_generate image=...`.
يُحدّ الصوت المتدفق، والاحتفاظ بالنص المنسوخ، وغلاف أحداث SSE المشتق
بواسطة `agents.defaults.mediaMaxMb` (الحد الافتراضي للصوت هو 16 ميغابايت).

## تحويل النص إلى كلام

يمكن أن يعمل OpenRouter كمزوّد لتحويل النص إلى كلام (TTS) من خلال نقطة النهاية المتوافقة مع OpenAI
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

إذا حُذف `messages.tts.providers.openrouter.apiKey`، فسيعود تحويل النص إلى كلام احتياطيًا إلى
`models.providers.openrouter.apiKey`، ثم إلى `OPENROUTER_API_KEY`.

## تحويل الكلام إلى نص (الصوت الوارد)

يمكن لـ OpenRouter نسخ مرفقات الصوت/الرسائل الصوتية الواردة من خلال المسار المشترك
`tools.media.audio`، باستخدام نقطة نهاية تحويل الكلام إلى نص (STT) الخاصة به (`/audio/transcriptions`).
ينطبق ذلك على أي Plugin قناة يمرّر الصوت/الرسائل الصوتية الواردة إلى
الفحص التمهيدي لفهم الوسائط.

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

يرسل OpenClaw طلبات تحويل الكلام إلى نص في OpenRouter بصيغة JSON مع صوت مشفّر بـ base64 ضمن
`input_audio` (وفق عقد تحويل الكلام إلى نص الخاص بـ OpenRouter)، وليس كعمليات رفع لنماذج OpenAI
متعددة الأجزاء.

## موجّه Fusion

يرسل OpenRouter Fusion مرجع نموذج واحدًا من OpenClaw إلى عدة نماذج OpenRouter
بالتوازي، ويجعل OpenRouter يحكم على إجاباتها، ثم يعيد استجابة نهائية واحدة
من خلال نقطة نهاية OpenRouter المعتادة. معرّف النموذج في المصدر الأعلى هو
`openrouter/fusion`، ولذلك يحمل مرجع نموذج OpenClaw كلًا من بادئة مزوّد OpenClaw
ونطاق أسماء OpenRouter في المصدر الأعلى:

```bash
openclaw models set openrouter/openrouter/fusion
```

اضبط لجنة Fusion ونموذج التحكيم من خلال `params.extraBody` الخاص بالنموذج؛
تُمرّر هذه الحقول مباشرةً إلى متن طلب إكمالات المحادثة في OpenRouter.
يعمل Fusion مع الإعداد الأولي عبر OAuth أو مفتاح API؛ وإذا كنت تستخدم OAuth،
فاحذف سطر `env.OPENROUTER_API_KEY` أدناه.

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

تمثّل `analysis_models` اللجنة المتوازية؛ أما `model` داخل إعدادات Plugin الخاص بـ Fusion
فهو نموذج التحكيم. لا تضبط `tool_choice` في المستوى الأعلى على `"required"`
في أدوار الوكيل/المحادثة المعتادة لمحاولة فرض Fusion؛ إذ قد تتضمن أدوار OpenClaw
تعريفات أدواته الخاصة، وقد يؤدي فرض اختيار أداة في المستوى الأعلى إلى اختيار إحدى
تلك الأدوات بدلًا من موجّه Fusion. عند وجود إعداد Plugin الخاص بـ Fusion هذا،
يضيف OpenClaw ملاحظة منقّحة إلى موجّه النظام تسرد نماذج التحليل المضبوطة
ونموذج التحكيم، بحيث يستطيع الوكيل الإجابة عن الأسئلة المتعلقة بلجنة Fusion
الخاصة به. لا تُنسخ حقول `extraBody` الأخرى إلى الموجّه.

يكون Fusion أبطأ حسب التصميم: يوزّع OpenRouter الموجّه على عدة
نماذج تحليل، ثم ينفّذ خطوة تحكيم/توليف، ولذلك يكون زمن الاستجابة أعلى من
طلب مباشر إلى نموذج واحد. استخدمه للحصول على إجابات متأنية وعالية الجودة أو
في مسارات التصعيد، وليس كخيار افتراضي حساس لزمن الاستجابة. أبقِ اللجنة صغيرة
واختر نماذج تحليل وتحكيم أسرع للحصول على استجابات أسرع.

اختبر مرجعًا مضبوطًا باستدعاء محلي لمرة واحدة:

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## المصادقة والترويسات

يستخدم OpenRouter رمز Bearer من مفتاح API الخاص بك. يمثّل OAuth في OpenRouter
تدفق تسجيل دخول باستخدام PKCE يُصدر مفتاح API لـ OpenRouter، ولذلك يخزّن OpenClaw النتيجة في
ملف تعريف مصادقة مفتاح API نفسه `openrouter:default` المستخدم عند
الإعداد اليدوي لمفتاح API.

لتسجيل الدخول أو تدوير المفتاح المخزّن في تثبيت حالي من دون إعادة تشغيل
الإعداد الأولي الكامل:

```bash
openclaw models auth login --provider openrouter --method oauth
openclaw models auth login --provider openrouter --method api-key
```

في طلبات OpenRouter الموثّقة (`https://openrouter.ai/api/v1`)، يضيف OpenClaw
ترويسات إسناد التطبيق الموثّقة في OpenRouter:

| الترويسة                  | القيمة                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
إذا أعدت توجيه مزوّد OpenRouter إلى وكيل آخر أو عنوان URL أساسي مختلف، فلن يحقن OpenClaw
ترويسات OpenRouter تلك أو علامات التخزين المؤقت الخاصة بـ Anthropic.
</Warning>

## الإعدادات المتقدمة

<AccordionGroup>
  <Accordion title="تخزين الاستجابات مؤقتًا">
    يتطلب تخزين استجابات OpenRouter مؤقتًا تفعيله صراحةً. فعّله لكل نموذج على حدة:

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

    يرسل OpenClaw `X-OpenRouter-Cache: true`، ويرسل أيضًا عند ضبطه
    `X-OpenRouter-Cache-TTL`. تفرض `responseCacheClear: true` تحديثًا
    للطلب الحالي وتخزّن الاستجابة البديلة. تُقبل الأسماء البديلة بصيغة snake_case
    (`response_cache` و`response_cache_ttl_seconds`
    و`response_cache_clear`)، كما تُقبل `responseCacheTtl` /
    `response_cache_ttl` من دون اللاحقة `Seconds`.

    يختلف ذلك عن تخزين موجّه المزوّد مؤقتًا وعن علامات Anthropic
    `cache_control` الخاصة بـ OpenRouter. ولا ينطبق إلا على مسارات
    `openrouter.ai` الموثّقة، وليس على عناوين URL الأساسية للوكلاء المخصصين.

  </Accordion>

  <Accordion title="علامات التخزين المؤقت الخاصة بـ Anthropic">
    في مسارات OpenRouter الموثّقة، تحتفظ مراجع نماذج Anthropic بعلامات
    `cache_control` الخاصة بـ Anthropic في OpenRouter لتحسين إعادة استخدام ذاكرة الموجّهات المؤقتة في
    كتل موجّهات النظام/المطوّر.
  </Accordion>

  <Accordion title="الملء المسبق لاستدلال Anthropic">
    في مسارات OpenRouter المتحقق منها، تُسقط مراجع نماذج Anthropic التي تم تمكين الاستدلال
    فيها أدوار الملء المسبق اللاحقة للمساعد قبل وصول الطلب إلى
    OpenRouter، بما يتوافق مع متطلب Anthropic بأن تنتهي محادثات الاستدلال
    بدور للمستخدم.
  </Accordion>

  <Accordion title="حقن التفكير / الاستدلال">
    في المسارات المدعومة غير المضبوطة على `auto`، يربط OpenClaw مستوى التفكير المحدد
    بحمولات استدلال وكيل OpenRouter. يتخطى `openrouter/auto` وتلميحات
    النماذج غير المدعومة هذا الحقن. كما تتخطاه مراجع `openrouter/hunter-alpha`
    القديمة، لأن OpenRouter كان من الممكن أن يعيد نص الإجابة النهائية في حقول الاستدلال
    على ذلك المسار المتقاعد.
  </Accordion>

  <Accordion title="إعادة تشغيل استدلال DeepSeek V4">
    في مسارات OpenRouter المتحقق منها، يملأ `openrouter/deepseek/deepseek-v4-flash`
    و`openrouter/deepseek/deepseek-v4-pro` قيمة `reasoning_content` المفقودة في
    أدوار المساعد المُعاد تشغيلها، مما يُبقي محادثات التفكير/الأدوات بالصيغة اللاحقة
    التي يتطلبها DeepSeek V4. يرسل OpenClaw قيم `reasoning.effort` التي يدعمها
    OpenRouter لهذه المسارات: تُربط `xhigh`/`max` بـ `xhigh`،
    ويُربط كل مستوى آخر غير معطّل بـ `high`.
  </Accordion>

  <Accordion title="تشكيل الطلبات الخاص بـ OpenAI فقط">
    يعمل OpenRouter عبر المسار المتوافق مع OpenAI والمصمم بأسلوب الوكيل، لذلك لا يُعاد توجيه
    تشكيل الطلبات الأصلي الخاص بـ OpenAI فقط، مثل `serviceTier` و`store` في Responses
    وحمولات توافق استدلال OpenAI وتلميحات ذاكرة التخزين المؤقت للموجّه.
  </Accordion>

  <Accordion title="المسارات المدعومة بواسطة Gemini">
    تظل مراجع OpenRouter المدعومة بواسطة Gemini على مسار الوكيل الخاص بـ Gemini: يحتفظ OpenClaw
    هناك بتنقية توقيعات أفكار Gemini، لكنه لا يُمكّن التحقق الأصلي
    من إعادة تشغيل Gemini أو عمليات إعادة كتابة التمهيد.
  </Accordion>

  <Accordion title="بيانات تعريف توجيه المزوّد">
    يدعم OpenRouter كائن طلب `provider` لتوجيه المزوّد
    الأساسي. اضبط سياسة افتراضية لجميع طلبات نماذج OpenRouter النصية
    باستخدام `models.providers.openrouter.params.provider`:

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

    يمرر OpenClaw ذلك الكائن إلى OpenRouter بصفته حمولة `provider`
    للطلب. استخدم حقول snake_case الموثقة في OpenRouter، بما فيها `sort`
    و`only` و`ignore` و`order` و`allow_fallbacks` و`require_parameters`
    و`data_collection` و`quantizations` و`max_price` و`preferred_max_latency`
    و`preferred_min_throughput` و`zdr` و`enforce_distillable_text`.

    تتجاوز معاملات كل نموذج كائن التوجيه العام للمزوّد:

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

    ينطبق هذا فقط على مسارات إكمال المحادثة في OpenRouter. تتجاهل مسارات Anthropic
    أو Google أو OpenAI المباشرة، وكذلك مسارات المزوّدين المخصصين، معاملات توجيه OpenRouter.

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك التحويل عند التعطل.
  </Card>
  <Card title="مرجع الإعدادات" href="/ar/gateway/configuration-reference" icon="gear">
    مرجع الإعدادات الكامل للوكلاء والنماذج والمزوّدين.
  </Card>
</CardGroup>
