---
read_when:
    - تريد نماذج MiniMax في OpenClaw
    - تحتاج إلى إرشادات إعداد MiniMax
summary: استخدم نماذج MiniMax في OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-06-27T18:25:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37fe606178d7d15383e56c026b02ba7be751ead706adc097c776c0a6a92aa2a2
    source_path: providers/minimax.md
    workflow: 16
---

يستخدم مزوّد MiniMax في OpenClaw **MiniMax M3** افتراضيًا.

يوفّر MiniMax أيضًا:

- توليد كلام مضمّنًا عبر T2A v2
- فهم صور مضمّنًا عبر `MiniMax-VL-01`
- توليد موسيقى مضمّنًا عبر `music-2.6`
- `web_search` مضمّنًا عبر واجهة API للبحث في MiniMax Token Plan

تقسيم المزوّد:

| معرّف المزوّد    | المصادقة | القدرات                                                                                   |
| ---------------- | -------- | ----------------------------------------------------------------------------------------- |
| `minimax`        | مفتاح API | نص، توليد صور، توليد موسيقى، توليد فيديو، فهم صور، كلام، بحث الويب                       |
| `minimax-portal` | OAuth    | نص، توليد صور، توليد موسيقى، توليد فيديو، فهم صور، كلام                                 |

## الفهرس المضمّن

| النموذج                  | النوع             | الوصف                                      |
| ------------------------ | ---------------- | ------------------------------------------ |
| `MiniMax-M3`             | محادثة (استدلال) | نموذج الاستدلال المستضاف الافتراضي         |
| `MiniMax-M2.7`           | محادثة (استدلال) | نموذج الاستدلال المستضاف السابق            |
| `MiniMax-M2.7-highspeed` | محادثة (استدلال) | طبقة استدلال M2.7 أسرع                     |
| `MiniMax-VL-01`          | رؤية             | نموذج فهم الصور                            |
| `image-01`               | توليد صور        | إنشاء نص إلى صورة وتحرير صورة إلى صورة     |
| `music-2.6`              | توليد موسيقى     | نموذج الموسيقى الافتراضي                   |
| `music-2.5`              | توليد موسيقى     | طبقة توليد الموسيقى السابقة                |
| `music-2.0`              | توليد موسيقى     | طبقة توليد الموسيقى القديمة                |
| `MiniMax-Hailuo-2.3`     | توليد فيديو      | تدفقات نص إلى فيديو ومراجع الصور           |

## البدء

اختر طريقة المصادقة المفضلة لديك واتبع خطوات الإعداد.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **الأفضل لـ:** إعداد سريع باستخدام MiniMax Coding Plan عبر OAuth، دون الحاجة إلى مفتاح API.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            يصادق هذا مقابل `api.minimax.io`.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            يصادق هذا مقابل `api.minimaxi.com`.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    تستخدم إعدادات OAuth معرّف المزوّد `minimax-portal`. تتبع مراجع النماذج الصيغة `minimax-portal/MiniMax-M3`.
    </Note>

    <Tip>
    رابط إحالة إلى MiniMax Coding Plan (خصم 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **الأفضل لـ:** MiniMax المستضاف مع API متوافقة مع Anthropic.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            يضبط هذا `api.minimax.io` بوصفه عنوان URL الأساسي.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            يضبط هذا `api.minimaxi.com` بوصفه عنوان URL الأساسي.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### مثال ضبط

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "minimax/MiniMax-M3" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.12, cacheWrite: 0 },
                contextWindow: 1000000,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7-highspeed",
                name: "MiniMax M2.7 Highspeed",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    في مسار البث المتوافق مع Anthropic، يعطّل OpenClaw تفكير MiniMax M2.x افتراضيًا ما لم تضبط `thinking` بنفسك صراحةً. تصدر نقطة نهاية البث في M2.x الحقل `reasoning_content` ضمن أجزاء دلتا بأسلوب OpenAI بدل كتل التفكير الأصلية في Anthropic، ما قد يسرّب الاستدلال الداخلي إلى المخرجات المرئية إذا تُرك مفعّلًا ضمنيًا. يُستثنى MiniMax-M3 (وM3.x المتوافق مستقبلًا) من هذا الإعداد الافتراضي: يصدر M3 كتل تفكير Anthropic سليمة ويتطلب أن يكون التفكير نشطًا لإنتاج محتوى مرئي، لذلك يُبقي OpenClaw M3 على مسار التفكير المحذوف/التكيّفي لدى المزوّد.
    </Warning>

    <Note>
    تستخدم إعدادات مفتاح API معرّف المزوّد `minimax`. تتبع مراجع النماذج الصيغة `minimax/MiniMax-M3`.
    </Note>

  </Tab>
</Tabs>

## الضبط عبر `openclaw configure`

استخدم معالج الضبط التفاعلي لإعداد MiniMax دون تحرير JSON:

<Steps>
  <Step title="Launch the wizard">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Select Model/auth">
    اختر **النموذج/المصادقة** من القائمة.
  </Step>
  <Step title="Choose a MiniMax auth option">
    اختر أحد خيارات MiniMax المتاحة:

    | خيار المصادقة | الوصف |
    | --- | --- |
    | `minimax-global-oauth` | OAuth دولي (Coding Plan) |
    | `minimax-cn-oauth` | OAuth الصين (Coding Plan) |
    | `minimax-global-api` | مفتاح API دولي |
    | `minimax-cn-api` | مفتاح API الصين |

  </Step>
  <Step title="Pick your default model">
    اختر نموذجك الافتراضي عند مطالبتك بذلك.
  </Step>
</Steps>

## القدرات

### توليد الصور

يسجّل Plugin MiniMax نموذج `image-01` لأداة `image_generate`. وهو يدعم:

- **توليد نص إلى صورة** مع التحكم في نسبة العرض إلى الارتفاع
- **تحرير صورة إلى صورة** (مرجع الموضوع) مع التحكم في نسبة العرض إلى الارتفاع
- ما يصل إلى **9 صور مخرجة** لكل طلب
- ما يصل إلى **صورة مرجعية واحدة** لكل طلب تحرير
- نسب العرض إلى الارتفاع المدعومة: `1:1`، `16:9`، `4:3`، `3:2`، `2:3`، `3:4`، `9:16`، `21:9`

لاستخدام MiniMax لتوليد الصور، اضبطه بوصفه مزوّد توليد الصور:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

يستخدم Plugin نفس `MINIMAX_API_KEY` أو مصادقة OAuth مثل نماذج النص. لا حاجة إلى ضبط إضافي إذا كان MiniMax معدًا بالفعل.

يسجّل كل من `minimax` و`minimax-portal` أداة `image_generate` بالنموذج نفسه
`image-01`. تستخدم إعدادات مفتاح API المتغير `MINIMAX_API_KEY`؛ ويمكن لإعدادات OAuth استخدام
مسار مصادقة `minimax-portal` المضمّن بدلًا من ذلك.

يستخدم توليد الصور دائمًا نقطة نهاية الصور المخصصة في MiniMax
(`/v1/image_generation`) ويتجاهل `models.providers.minimax.baseUrl`،
لأن ذلك الحقل يضبط عنوان URL الأساسي للدردشة/المتوافق مع Anthropic. اضبط
`MINIMAX_API_HOST=https://api.minimaxi.com` لتوجيه توليد الصور
عبر نقطة نهاية الصين؛ نقطة النهاية العالمية الافتراضية هي
`https://api.minimax.io`.

عندما يكتب الإعداد الأولي أو إعداد مفتاح API إدخالات `models.providers.minimax`
صريحة، يجسّد OpenClaw النماذج `MiniMax-M3` و`MiniMax-M2.7` و
`MiniMax-M2.7-highspeed` كنماذج دردشة. يعلن M3 عن إدخال النص والصور؛
ويظل فهم الصور مكشوفًا بشكل منفصل عبر مزوّد الوسائط
`MiniMax-VL-01` المملوك لـ Plugin.

<Note>
راجع [توليد الصور](/ar/tools/image-generation) للاطلاع على معلمات الأداة المشتركة، واختيار المزوّد، وسلوك تجاوز الفشل.
</Note>

### تحويل النص إلى كلام

يسجّل Plugin `minimax` المضمّن MiniMax T2A v2 بوصفه مزوّد كلام لـ
`messages.tts`.

- نموذج TTS الافتراضي: `speech-2.8-hd`
- الصوت الافتراضي: `English_expressive_narrator`
- تشمل معرّفات النماذج المضمّنة المدعومة `speech-2.8-hd` و`speech-2.8-turbo`،
  و`speech-2.6-hd` و`speech-2.6-turbo` و`speech-02-hd`،
  و`speech-02-turbo` و`speech-01-hd` و`speech-01-turbo`.
- حلّ المصادقة هو `messages.tts.providers.minimax.apiKey`، ثم
  ملفات تعريف مصادقة OAuth/الرمز لـ `minimax-portal`، ثم مفاتيح بيئة Token Plan
  (`MINIMAX_OAUTH_TOKEN`، `MINIMAX_CODE_PLAN_KEY`،
  `MINIMAX_CODING_API_KEY`)، ثم `MINIMAX_API_KEY`.
- إذا لم يُضبط مضيف TTS، يعيد OpenClaw استخدام مضيف OAuth المضبوط لـ
  `minimax-portal` ويزيل لواحق المسار المتوافقة مع Anthropic
  مثل `/anthropic`.
- تظل مرفقات الصوت العادية بصيغة MP3.
- تُحوّل أهداف الملاحظات الصوتية مثل Feishu وTelegram من MiniMax
  MP3 إلى Opus بتردد 48kHz باستخدام `ffmpeg`، لأن API ملفات Feishu/Lark لا تقبل إلا
  `file_type: "opus"` للرسائل الصوتية الأصلية.
- يقبل MiniMax T2A قيم `speed` و`vol` الكسرية، لكن يُرسل `pitch` كعدد
  صحيح؛ يقتطع OpenClaw قيم `pitch` الكسرية قبل طلب API.

| الإعداد                                         | متغير البيئة           | الافتراضي                    | الوصف                                      |
| ----------------------------------------------- | ---------------------- | ----------------------------- | ------------------------------------------ |
| `messages.tts.providers.minimax.baseUrl`        | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | مضيف API لـ MiniMax T2A.                  |
| `messages.tts.providers.minimax.model`          | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | معرّف نموذج TTS.                          |
| `messages.tts.providers.minimax.speakerVoiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | معرّف الصوت المستخدم لمخرجات الكلام.      |
| `messages.tts.providers.minimax.speed`          |                        | `1.0`                         | سرعة التشغيل، `0.5..2.0`.                 |
| `messages.tts.providers.minimax.vol`            |                        | `1.0`                         | مستوى الصوت، `(0, 10]`.                   |
| `messages.tts.providers.minimax.pitch`          |                        | `0`                           | إزاحة الحدة بعدد صحيح، `-12..12`.         |

### توليد الموسيقى

يسجّل Plugin MiniMax المضمّن توليد الموسيقى عبر الأداة المشتركة
`music_generate` لكل من `minimax` و`minimax-portal`.

- نموذج الموسيقى الافتراضي: `minimax/music-2.6`
- نموذج موسيقى OAuth: `minimax-portal/music-2.6`
- يدعم أيضاً `minimax/music-2.5` و`minimax/music-2.0`
- عناصر التحكم في الموجه: `lyrics`، `instrumental`
- تنسيق الإخراج: `mp3`
- عمليات التشغيل المدعومة بالجلسة تنفصل عبر تدفق المهام/الحالة المشترك، بما في ذلك `action: "status"`

لاستخدام MiniMax كمزوّد الموسيقى الافتراضي:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "minimax/music-2.6",
      },
    },
  },
}
```

<Note>
راجع [توليد الموسيقى](/ar/tools/music-generation) لمعلمات الأداة المشتركة، واختيار المزوّد، وسلوك تجاوز الفشل.
</Note>

### توليد الفيديو

يسجّل Plugin MiniMax المضمّن توليد الفيديو عبر أداة
`video_generate` المشتركة لكلٍّ من `minimax` و`minimax-portal`.

- نموذج الفيديو الافتراضي: `minimax/MiniMax-Hailuo-2.3`
- نموذج فيديو OAuth: `minimax-portal/MiniMax-Hailuo-2.3`
- الأوضاع: تدفقات تحويل النص إلى فيديو وتدفقات مرجع الصورة الواحدة
- يدعم `aspectRatio` و`resolution`

لاستخدام MiniMax كمزوّد الفيديو الافتراضي:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "minimax/MiniMax-Hailuo-2.3",
      },
    },
  },
}
```

<Note>
راجع [توليد الفيديو](/ar/tools/video-generation) لمعلمات الأداة المشتركة، واختيار المزوّد، وسلوك تجاوز الفشل.
</Note>

### فهم الصور

يسجّل Plugin MiniMax فهم الصور بشكل منفصل عن كتالوج النص:

| معرّف المزوّد      | نموذج الصور الافتراضي |
| ---------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     |
| `minimax-portal` | `MiniMax-VL-01`     |

لهذا السبب يمكن للتوجيه التلقائي للوسائط استخدام فهم الصور من MiniMax حتى
عندما يتضمن كتالوج مزوّد النصوص المضمّن أيضاً مراجع دردشة M3 القادرة على معالجة الصور.

### بحث الويب

يسجّل Plugin MiniMax أيضاً `web_search` عبر واجهة API للبحث الخاصة بخطة رموز MiniMax.

- معرّف المزوّد: `minimax`
- النتائج المهيكلة: العناوين، عناوين URL، المقتطفات، الاستعلامات ذات الصلة
- متغير البيئة المفضّل: `MINIMAX_CODE_PLAN_KEY`
- أسماء البيئة البديلة المقبولة: `MINIMAX_CODING_API_KEY`، `MINIMAX_OAUTH_TOKEN`
- بديل التوافق: `MINIMAX_API_KEY` عندما يشير بالفعل إلى بيانات اعتماد خطة الرموز
- إعادة استخدام المنطقة: `plugins.entries.minimax.config.webSearch.region`، ثم `MINIMAX_API_HOST`، ثم عناوين URL الأساسية لمزوّد MiniMax
- يبقى البحث على معرّف المزوّد `minimax`؛ يمكن لإعداد OAuth الصيني/العالمي توجيه المنطقة بشكل غير مباشر عبر `models.providers.minimax-portal.baseUrl` ويمكنه توفير مصادقة الحامل عبر `MINIMAX_OAUTH_TOKEN`

يوجد الإعداد ضمن `plugins.entries.minimax.config.webSearch.*`.

<Note>
راجع [بحث MiniMax](/ar/tools/minimax-search) للاطلاع على إعداد بحث الويب الكامل واستخدامه.
</Note>

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="خيارات الإعداد">
    | الخيار | الوصف |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | يُفضّل `https://api.minimax.io/anthropic` (متوافق مع Anthropic)؛ `https://api.minimax.io/v1` اختياري للحمولات المتوافقة مع OpenAI |
    | `models.providers.minimax.api` | يُفضّل `anthropic-messages`؛ `openai-completions` اختياري للحمولات المتوافقة مع OpenAI |
    | `models.providers.minimax.apiKey` | مفتاح API من MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | عرّف `id`، و`name`، و`reasoning`، و`contextWindow`، و`maxTokens`، و`cost` |
    | `agents.defaults.models` | أنشئ أسماء مستعارة للنماذج التي تريدها في قائمة السماح |
    | `models.mode` | أبقِ `merge` إذا كنت تريد إضافة MiniMax إلى جانب المضمّنات |
  </Accordion>

  <Accordion title="افتراضيات التفكير">
    عند `api: "anthropic-messages"`، يحقن OpenClaw ‏`thinking: { type: "disabled" }` لنماذج MiniMax M2.x ما لم يكن التفكير مضبوطاً صراحةً مسبقاً في المعلمات/الإعداد.

    يمنع هذا نقطة نهاية البث في M2.x من إصدار `reasoning_content` ضمن أجزاء دلتا بأسلوب OpenAI، ما قد يسرّب التفكير الداخلي إلى الإخراج المرئي.

    يُستثنى MiniMax-M3 (وM3.x): يصدر M3 كتل تفكير Anthropic صحيحة ويعيد مصفوفة `content` فارغة مع `stop_reason: "end_turn"` عندما يكون التفكير معطلاً، لذلك يُبقي الغلاف M3 على مسار التفكير المحذوف/التكيفي الخاص بالمزوّد.

  </Accordion>

  <Accordion title="الوضع السريع">
    يعيد `/fast on` أو `params.fastMode: true` كتابة `MiniMax-M2.7` إلى `MiniMax-M2.7-highspeed` على مسار البث المتوافق مع Anthropic.
  </Accordion>

  <Accordion title="مثال احتياطي">
    **الأفضل لـ:** إبقاء أقوى نموذج لديك من أحدث جيل كنموذج أساسي، مع تجاوز الفشل إلى MiniMax M2.7. يستخدم المثال أدناه Opus كنموذج أساسي ملموس؛ استبدله بنموذجك الأساسي المفضّل من أحدث جيل.

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": { alias: "primary" },
            "minimax/MiniMax-M2.7": { alias: "minimax" },
          },
          model: {
            primary: "anthropic/claude-opus-4-6",
            fallbacks: ["minimax/MiniMax-M2.7"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="تفاصيل استخدام خطة البرمجة">
    - واجهة API لاستخدام خطة البرمجة: `https://api.minimaxi.com/v1/token_plan/remains` أو `https://api.minimax.io/v1/token_plan/remains` (تتطلب مفتاح خطة برمجة).
    - يستمد استطلاع الاستخدام المضيف من `models.providers.minimax-portal.baseUrl` أو `models.providers.minimax.baseUrl` عند ضبطهما، لذلك تستطلع الإعدادات العالمية التي تستخدم `https://api.minimax.io/anthropic` المضيف `api.minimax.io`. تبقي عناوين URL الأساسية المفقودة أو غير الصحيحة على البديل الصيني للتوافق.
    - يطبّع OpenClaw استخدام خطة البرمجة في MiniMax إلى عرض `% left` نفسه المستخدم من المزوّدين الآخرين. حقلا MiniMax الخامان `usage_percent` / `usagePercent` هما الحصة المتبقية، وليسا الحصة المستهلكة، لذلك يعكسهما OpenClaw. تتقدم الحقول المعتمدة على العدد عند وجودها.
    - عندما تعيد واجهة API ‏`model_remains`، يفضّل OpenClaw إدخال نموذج الدردشة، ويستمد تسمية النافذة من `start_time` / `end_time` عند الحاجة، ويتضمن اسم النموذج المحدد في تسمية الخطة لتسهيل تمييز نوافذ خطة البرمجة.
    - تتعامل لقطات الاستخدام مع `minimax` و`minimax-cn` و`minimax-portal` كسطح حصة MiniMax نفسه، وتفضّل MiniMax OAuth المخزّن قبل الرجوع إلى متغيرات بيئة مفتاح خطة البرمجة.

  </Accordion>
</AccordionGroup>

## ملاحظات

- تتبع مراجع النماذج مسار المصادقة:
  - إعداد مفتاح API: `minimax/<model>`
  - إعداد OAuth: `minimax-portal/<model>`
- نموذج الدردشة الافتراضي: `MiniMax-M3`
- نماذج الدردشة البديلة: `MiniMax-M2.7`، `MiniMax-M2.7-highspeed`
- تكتب عملية الإعداد الأولي وإعداد مفتاح API المباشر تعريفات النماذج لـ M3 وكلا متغيري M2.7
- يستخدم فهم الصور مزوّد الوسائط `MiniMax-VL-01` المملوك للـ Plugin
- حدّث قيم الأسعار في `models.json` إذا كنت تحتاج إلى تتبع تكلفة دقيق
- استخدم `openclaw models list` لتأكيد معرّف المزوّد الحالي، ثم بدّل باستخدام `openclaw models set minimax/MiniMax-M3` أو `openclaw models set minimax-portal/MiniMax-M3`

<Tip>
رابط الإحالة لخطة برمجة MiniMax (خصم 10%): [خطة برمجة MiniMax](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
راجع [مزوّدو النماذج](/ar/concepts/model-providers) لقواعد المزوّد.
</Note>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M3"'>
    يعني هذا عادةً أن **مزوّد MiniMax غير مضبوط** (لا يوجد إدخال مزوّد مطابق ولا ملف مصادقة/مفتاح بيئة MiniMax مطابق). يوجد إصلاح لهذا الاكتشاف في **2026.1.12**. أصلح ذلك عبر:

    - الترقية إلى **2026.1.12** (أو التشغيل من المصدر `main`)، ثم إعادة تشغيل Gateway.
    - تشغيل `openclaw configure` واختيار خيار مصادقة **MiniMax**، أو
    - إضافة كتلة `models.providers.minimax` أو `models.providers.minimax-portal` المطابقة يدوياً، أو
    - ضبط `MINIMAX_API_KEY` أو `MINIMAX_OAUTH_TOKEN` أو ملف مصادقة MiniMax حتى يمكن حقن المزوّد المطابق.

    تأكد من أن معرّف النموذج **حساس لحالة الأحرف**:

    - مسار مفتاح API: `minimax/MiniMax-M3`، أو `minimax/MiniMax-M2.7`، أو `minimax/MiniMax-M2.7-highspeed`
    - مسار OAuth: `minimax-portal/MiniMax-M3`، أو `minimax-portal/MiniMax-M2.7`، أو `minimax-portal/MiniMax-M2.7-highspeed`

    ثم أعد التحقق باستخدام:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
مزيد من المساعدة: [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) و[الأسئلة الشائعة](/ar/help/faq).
</Note>

## ذات صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك تجاوز الفشل.
  </Card>
  <Card title="توليد الصور" href="/ar/tools/image-generation" icon="image">
    معلمات أداة الصور المشتركة واختيار المزوّد.
  </Card>
  <Card title="توليد الموسيقى" href="/ar/tools/music-generation" icon="music">
    معلمات أداة الموسيقى المشتركة واختيار المزوّد.
  </Card>
  <Card title="توليد الفيديو" href="/ar/tools/video-generation" icon="video">
    معلمات أداة الفيديو المشتركة واختيار المزوّد.
  </Card>
  <Card title="بحث MiniMax" href="/ar/tools/minimax-search" icon="magnifying-glass">
    إعداد بحث الويب عبر خطة رموز MiniMax.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    استكشاف الأخطاء وإصلاحها العام والأسئلة الشائعة.
  </Card>
</CardGroup>
