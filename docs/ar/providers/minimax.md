---
read_when:
    - تريد استخدام نماذج MiniMax في OpenClaw
    - تحتاج إلى إرشادات لإعداد MiniMax
summary: استخدام نماذج MiniMax في OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-07-12T06:28:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1172d2d2c92dc92858f15564eee9ffeb8eb9599ee70157116fd2e302556dd75a
    source_path: providers/minimax.md
    workflow: 16
---

  تسجّل إضافة `minimax` المضمّنة مزوّدَين بالإضافة إلى سبع إمكانات: الدردشة، وتوليد الصور، وتوليد الموسيقى، وتوليد الفيديو، وفهم الصور، والكلام (T2A v2)، والبحث على الويب.

  | معرّف المزوّد     | المصادقة   | الإمكانات                                                                                              |
  | ---------------- | ----------- | ------------------------------------------------------------------------------------------------------ |
  | `minimax`        | مفتاح API   | النص، وتوليد الصور، وتوليد الموسيقى، وتوليد الفيديو، وفهم الصور، والكلام، والبحث على الويب             |
  | `minimax-portal` | OAuth       | النص، وتوليد الصور، وتوليد الموسيقى، وتوليد الفيديو، وفهم الصور، والكلام                               |

  <Tip>
  رابط إحالة لخطة MiniMax Coding Plan (خصم 10%): [خطة MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
  </Tip>

  ## الكتالوج المضمّن

  | النموذج                  | النوع                   | الوصف                                      |
  | ------------------------ | ----------------------- | ------------------------------------------ |
  | `MiniMax-M3`             | دردشة (استدلال)         | نموذج الاستدلال المستضاف الافتراضي         |
  | `MiniMax-M2.7`           | دردشة (استدلال)         | نموذج الاستدلال المستضاف السابق            |
  | `MiniMax-M2.7-highspeed` | دردشة (استدلال)         | فئة استدلال M2.7 الأسرع                    |
  | `MiniMax-VL-01`          | رؤية                    | نموذج فهم الصور                            |
  | `image-01`               | توليد الصور             | تحويل النص إلى صورة وتحرير صورة إلى صورة   |
  | `music-2.6`              | توليد الموسيقى          | نموذج الموسيقى الافتراضي                   |
  | `MiniMax-Hailuo-2.3`     | توليد الفيديو           | مسارات تحويل النص والصورة إلى فيديو        |

  تتبع مراجع النماذج مسار المصادقة: `minimax/<model>` للإعدادات التي تستخدم مفتاح API، و`minimax-portal/<model>` لإعدادات OAuth.

  ## بدء الاستخدام

  <Tabs>
  <Tab title="OAuth (خطة Coding Plan)">
    **الأنسب لـ:** الإعداد السريع باستخدام MiniMax Coding Plan عبر OAuth، من دون الحاجة إلى مفتاح API.

    <Tabs>
      <Tab title="دولي">
        <Steps>
          <Step title="تشغيل الإعداد الأولي">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            عنوان URL الأساسي الناتج للمزوّد: `api.minimax.io`.
          </Step>
          <Step title="التحقق من توفر النموذج">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="الصين">
        <Steps>
          <Step title="تشغيل الإعداد الأولي">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            عنوان URL الأساسي الناتج للمزوّد: `api.minimaxi.com`.
          </Step>
          <Step title="التحقق من توفر النموذج">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    تستخدم إعدادات OAuth معرّف المزوّد `minimax-portal`. وتتبع مراجع النماذج الصيغة `minimax-portal/MiniMax-M3`.
    </Note>

  </Tab>

  <Tab title="مفتاح API">
    **الأنسب لـ:** MiniMax المستضاف مع API متوافق مع Anthropic.

    <Tabs>
      <Tab title="دولي">
        <Steps>
          <Step title="تشغيل الإعداد الأولي">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            يؤدي هذا إلى ضبط `api.minimax.io` بوصفه عنوان URL الأساسي.
          </Step>
          <Step title="التحقق من توفر النموذج">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="الصين">
        <Steps>
          <Step title="تشغيل الإعداد الأولي">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            يؤدي هذا إلى ضبط `api.minimaxi.com` بوصفه عنوان URL الأساسي.
          </Step>
          <Step title="التحقق من توفر النموذج">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### مثال على الإعداد

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
    تُصدر نقطة نهاية البث المتوافقة مع Anthropic في MiniMax-M2.x الحقل `reasoning_content` ضمن أجزاء دلتا بأسلوب OpenAI بدلًا من كتل التفكير الأصلية في Anthropic، ما يكشف الاستدلال الداخلي في المخرجات المرئية إذا تُرك التفكير مفعّلًا ضمنيًا. يعطّل OpenClaw التفكير في M2.x افتراضيًا ما لم تضبط `thinking` بنفسك صراحةً. ويُستثنى MiniMax-M3 (وإصدارات M3.x المتوافقة مستقبلًا): إذ يُصدر M3 كتل تفكير صحيحة بتنسيق Anthropic، ويتطلب تفعيل التفكير لإنتاج محتوى مرئي، لذلك يُبقي OpenClaw نموذج M3 ضمن مسار التفكير التكيّفي للمزوّد. راجع قسم الإعدادات الافتراضية للتفكير ضمن الإعداد المتقدم أدناه.
    </Warning>

    <Note>
    تستخدم الإعدادات المعتمدة على مفتاح API معرّف المزوّد `minimax`. وتتبع مراجع النماذج الصيغة `minimax/MiniMax-M3`.
    </Note>

  </Tab>
</Tabs>

## الإعداد عبر `openclaw configure`

<Steps>
  <Step title="تشغيل المعالج">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="تحديد النموذج/المصادقة">
    اختر **النموذج/المصادقة** من القائمة.
  </Step>
  <Step title="اختيار أحد خيارات مصادقة MiniMax">
    | خيار المصادقة           | الوصف                               |
    | ----------------------- | ----------------------------------- |
    | `minimax-global-oauth` | OAuth الدولي (خطة البرمجة)          |
    | `minimax-cn-oauth`     | OAuth للصين (خطة البرمجة)           |
    | `minimax-global-api`   | مفتاح API الدولي                    |
    | `minimax-cn-api`       | مفتاح API للصين                     |
  </Step>
  <Step title="اختيار النموذج الافتراضي">
    حدّد نموذجك الافتراضي عند مطالبتك بذلك.
  </Step>
</Steps>

## الإمكانات

### توليد الصور

يسجّل Plugin الخاص بـ MiniMax النموذج `image-01` لأداة `image_generate` على كل من `minimax` و`minimax-portal`، مع إعادة استخدام `MINIMAX_API_KEY` نفسه أو مصادقة OAuth المستخدمة لنماذج النصوص.

- توليد الصور من النص وتحرير صورة بناءً على صورة أخرى (مرجع العنصر)، وكلاهما مع إمكانية التحكم في نسبة العرض إلى الارتفاع
- ما يصل إلى 9 صور ناتجة لكل طلب، وصورة مرجعية واحدة لكل طلب تحرير
- نسب العرض إلى الارتفاع المدعومة: `1:1`، `16:9`، `4:3`، `3:2`، `2:3`، `3:4`، `9:16`، `21:9`

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

يستخدم توليد الصور دائمًا نقطة نهاية الصور المخصصة من MiniMax‏ (`/v1/image_generation`) ويتجاهل `models.providers.minimax.baseUrl`، لأن هذا الحقل يضبط بدلًا من ذلك عنوان URL الأساسي المتوافق مع الدردشة/Anthropic. اضبط `MINIMAX_API_HOST=https://api.minimaxi.com` لتوجيه توليد الصور عبر نقطة النهاية الصينية؛ نقطة النهاية العالمية الافتراضية هي `https://api.minimax.io`.

<Note>
راجع [توليد الصور](/ar/tools/image-generation) لمعرفة معلمات الأداة المشتركة واختيار المزوّد وسلوك تجاوز الفشل.
</Note>

### تحويل النص إلى كلام

يسجّل Plugin المضمّن `minimax` الإصدار MiniMax T2A v2 كمزوّد صوت لـ `messages.tts`.

- نموذج TTS الافتراضي: `speech-2.8-hd`
- الصوت الافتراضي: `English_expressive_narrator`
- معرّفات النماذج المضمّنة: `speech-2.8-hd`، `speech-2.8-turbo`، `speech-2.6-hd`، `speech-2.6-turbo`، `speech-02-hd`، `speech-02-turbo`، `speech-01-hd`، `speech-01-turbo`، `speech-01-240228`
- ترتيب تحديد المصادقة: `messages.tts.providers.minimax.apiKey`، ثم ملفات تعريف مصادقة OAuth/الرمز المميز لـ `minimax-portal`، ثم مفاتيح بيئة خطة الرمز المميز (`MINIMAX_OAUTH_TOKEN`، و`MINIMAX_CODE_PLAN_KEY`، و`MINIMAX_CODING_API_KEY`)، ثم `MINIMAX_API_KEY`
- إذا لم يُضبط مضيف TTS، يعيد OpenClaw استخدام مضيف OAuth المضبوط لـ `minimax-portal` ويزيل لواحق المسارات المتوافقة مع Anthropic، مثل `/anthropic`
- تظل مرفقات الصوت العادية بتنسيق MP3. أما وجهات الرسائل الصوتية (Feishu وTelegram والقنوات الأخرى التي تطلب مرفقًا متوافقًا مع الرسائل الصوتية)، فتُحوّل ترميزيًا من MiniMax MP3 إلى Opus بتردد 48 كيلوهرتز باستخدام `ffmpeg`، لأن واجهة API للملفات في Feishu/Lark، على سبيل المثال، لا تقبل سوى `file_type: "opus"` للرسائل الصوتية الأصلية
- يقبل MiniMax T2A قيمًا كسرية لكل من `speed` و`vol`، لكن `pitch` يُرسل كعدد صحيح؛ يقتطع OpenClaw الجزء الكسري من قيم `pitch` قبل طلب API

| الإعداد                                    | متغير البيئة             | القيمة الافتراضية              | الوصف                                    |
| ------------------------------------------ | ------------------------ | ------------------------------- | ---------------------------------------- |
| `messages.tts.providers.minimax.baseUrl`   | `MINIMAX_API_HOST`       | `https://api.minimax.io`        | مضيف API لـ MiniMax T2A.                 |
| `messages.tts.providers.minimax.model`     | `MINIMAX_TTS_MODEL`      | `speech-2.8-hd`                 | معرّف نموذج TTS.                         |
| `messages.tts.providers.minimax.voiceId`   | `MINIMAX_TTS_VOICE_ID`   | `English_expressive_narrator`   | معرّف الصوت المستخدم لإخراج الكلام.     |
| `messages.tts.providers.minimax.speed`     |                          | `1.0`                           | سرعة التشغيل، `0.5..2.0`.                |
| `messages.tts.providers.minimax.vol`       |                          | `1.0`                           | مستوى الصوت، `(0, 10]`.                  |
| `messages.tts.providers.minimax.pitch`     |                          | `0`                             | إزاحة حدة الصوت الصحيحة، `-12..12`.      |

### توليد الموسيقى

يسجّل Plugin المضمّن الخاص بـ MiniMax توليد الموسيقى عبر أداة `music_generate` المشتركة لكل من `minimax` و`minimax-portal`.

- نموذج الموسيقى الافتراضي: `minimax/music-2.6`‏ (OAuth: ‏`minimax-portal/music-2.6`)
- يدعم أيضًا `music-2.6-free` و`music-cover` و`music-cover-free`
- عناصر التحكم في الموجّه: `lyrics`، و`instrumental`
- تنسيق الإخراج: `mp3`
- تُفصل عمليات التشغيل المدعومة بجلسة عبر مسار المهمة/الحالة المشترك، بما في ذلك `action: "status"`

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: { primary: "minimax/music-2.6" },
    },
  },
}
```

<Note>
راجع [توليد الموسيقى](/ar/tools/music-generation) لمعرفة معلمات الأداة المشتركة واختيار المزوّد وسلوك تجاوز الفشل.
</Note>

### توليد الفيديو

يسجّل Plugin المضمّن الخاص بـ MiniMax توليد الفيديو عبر أداة `video_generate` المشتركة لكل من `minimax` و`minimax-portal`.

- نموذج الفيديو الافتراضي: `minimax/MiniMax-Hailuo-2.3`‏ (OAuth: ‏`minimax-portal/MiniMax-Hailuo-2.3`)
- يدعم أيضًا `MiniMax-Hailuo-2.3-Fast` و`MiniMax-Hailuo-02` و`I2V-01-Director` و`I2V-01-live` و`I2V-01`
- الأوضاع: تحويل النص إلى فيديو ومسارات المرجع بصورة واحدة
- يدعم `resolution`‏ (`768P` أو `1080P` في نماذج Hailuo 2.3/02)؛ أما `aspectRatio` فغير مدعوم ويُتجاهل

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "minimax/MiniMax-Hailuo-2.3" },
    },
  },
}
```

<Note>
راجع [إنشاء الفيديو](/ar/tools/video-generation) للاطلاع على معلمات الأداة المشتركة، واختيار المزوّد، وسلوك التحويل عند التعذّر.
</Note>

### فهم الصور

يسجّل Plugin ‏MiniMax فهم الصور بشكل منفصل عن كتالوج النصوص:

| معرّف المزوّد     | نموذج الصور الافتراضي | استخراج النص من PDF |
| ---------------- | ------------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     | `MiniMax-M2.7`      |
| `minimax-portal` | `MiniMax-VL-01`     | `MiniMax-M2.7`      |

لهذا السبب، يمكن للتوجيه التلقائي للوسائط استخدام فهم الصور من MiniMax حتى عندما يتضمن كتالوج مزوّد النصوص المضمّن أيضًا مراجع محادثة من M3 تدعم الصور. يستخدم فهم PDF النموذج `MiniMax-M2.7` لاستخراج النص فقط؛ ولا يسجّل MiniMax مسارًا لتحويل PDF إلى صور.

### البحث على الويب

يسجّل Plugin ‏MiniMax أيضًا `web_search` عبر واجهة API للبحث في MiniMax Token Plan ‏(`/v1/coding_plan/search`).

- معرّف المزوّد: `minimax`
- النتائج المنظّمة: العناوين، وعناوين URL، والمقتطفات، والاستعلامات ذات الصلة
- متغير البيئة المفضّل: `MINIMAX_CODE_PLAN_KEY`
- أسماء متغيرات البيئة البديلة المقبولة: `MINIMAX_CODING_API_KEY`، و`MINIMAX_OAUTH_TOKEN`
- الإجراء الاحتياطي للتوافق: `MINIMAX_API_KEY` عندما يشير بالفعل إلى بيانات اعتماد لخطة الرموز
- إعادة استخدام المنطقة: `plugins.entries.minimax.config.webSearch.region`، ثم `MINIMAX_API_HOST`، ثم عناوين URL الأساسية لمزوّد MiniMax
- يظل البحث مرتبطًا بمعرّف المزوّد `minimax`؛ ويمكن لإعداد OAuth للصين/العالمي توجيه المنطقة بصورة غير مباشرة عبر `models.providers.minimax-portal.baseUrl`، كما يمكنه توفير مصادقة حامل الرمز عبر `MINIMAX_OAUTH_TOKEN`

يوجد الإعداد ضمن `plugins.entries.minimax.config.webSearch.*`.

<Note>
راجع [بحث MiniMax](/ar/tools/minimax-search) للاطلاع على إعداد البحث على الويب واستخدامه بالكامل.
</Note>

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="خيارات الإعداد">
    | الخيار | الوصف |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | يُفضّل استخدام `https://api.minimax.io/anthropic` (متوافق مع Anthropic)؛ ويمكن اختياريًا استخدام `https://api.minimax.io/v1` للحمولات المتوافقة مع OpenAI |
    | `models.providers.minimax.api` | يُفضّل استخدام `anthropic-messages`؛ ويمكن اختياريًا استخدام `openai-completions` للحمولات المتوافقة مع OpenAI |
    | `models.providers.minimax.apiKey` | مفتاح API لـ MiniMax ‏(`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | تحديد `id`، و`name`، و`reasoning`، و`contextWindow`، و`maxTokens`، و`cost` |
    | `agents.defaults.models` | تعيين أسماء مستعارة للنماذج التي تريد إدراجها في قائمة السماح |
    | `models.mode` | احتفظ بالقيمة `merge` إذا كنت تريد إضافة MiniMax إلى جانب النماذج المضمّنة |
  </Accordion>

  <Accordion title="إعدادات التفكير الافتراضية">
    عند استخدام `api: "anthropic-messages"`، يضيف OpenClaw القيمة `thinking: { type: "disabled" }` إلى نماذج MiniMax M2.x، ما لم يكن غلاف سابق قد عيّن بالفعل الحقل `thinking` في الحمولة. يمنع ذلك نقطة نهاية البث الخاصة بـ M2.x من إصدار `reasoning_content` ضمن أجزاء فروق بأسلوب OpenAI، وهو ما قد يكشف الاستدلال الداخلي في المخرجات الظاهرة.

    يُستثنى MiniMax-M3 ‏(وM3.x): إذ يعيد M3 مصفوفة `content` فارغة مع `stop_reason: "end_turn"` عند تعطيل التفكير، لذلك يزيل OpenClaw الإعداد الافتراضي الضمني للتعطيل في M3، وعند تعيين مستوى للتفكير يفرض بدلًا منه `thinking: { type: "adaptive" }`.

    مستويات التفكير المتاحة لكل عائلة نماذج:

    | عائلة النموذج   | المستويات                                   | الافتراضي    |
    | -------------- | ----------------------------------------- | ---------- |
    | `MiniMax-M3`   | `off`، `adaptive`                        | `adaptive` |
    | `MiniMax-M2.x` | `off`، `minimal`، `low`، `medium`، `high` | `off`      |

  </Accordion>

  <Accordion title="الوضع السريع">
    يعيد `/fast on` أو `params.fastMode: true` توجيه `MiniMax-M2.7` إلى `MiniMax-M2.7-highspeed` في مسار البث المتوافق مع Anthropic ‏(`api: "anthropic-messages"`، والمزوّد `minimax` أو `minimax-portal`).
  </Accordion>

  <Accordion title="مثال على التحويل عند التعذّر">
    **الأنسب لـ:** إبقاء أقوى نموذج لديك من أحدث جيل نموذجًا أساسيًا، مع التحويل إلى MiniMax M2.7 عند التعذّر. يستخدم المثال أدناه Opus نموذجًا أساسيًا محددًا؛ استبدله بنموذجك الأساسي المفضّل من أحدث جيل.

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

  <Accordion title="تفاصيل استخدام Coding Plan">
    - واجهة API لاستخدام Coding Plan: ‏`https://api.minimaxi.com/v1/token_plan/remains` أو `https://api.minimax.io/v1/token_plan/remains` (تتطلب مفتاح Coding Plan).
    - يستنتج استطلاع الاستخدام المضيف من `models.providers.minimax-portal.baseUrl` أو `models.providers.minimax.baseUrl` عند إعداده، ولذلك تستطلع الإعدادات العالمية التي تستخدم `https://api.minimax.io/anthropic` المضيف `api.minimax.io`. عند غياب عناوين URL الأساسية أو عدم صلاحيتها، يُحتفظ بالإجراء الاحتياطي الخاص بالصين للتوافق.
    - يوحّد OpenClaw استخدام Coding Plan في MiniMax مع عرض `% left` نفسه المستخدم لدى المزوّدين الآخرين. تمثّل حقول MiniMax الأولية `usage_percent` و`usagePercent` الحصة المتبقية لا الحصة المستهلكة، لذلك يعكس OpenClaw قيمها. وتكون الأولوية للحقول القائمة على العدد عند توفرها.
    - عندما تعيد واجهة API الحقل `model_remains`، يفضّل OpenClaw إدخال نموذج المحادثة، ويستنتج تسمية النافذة من `start_time` و`end_time` عند الحاجة، ويضمّن اسم النموذج المحدد في تسمية الخطة لتسهيل التمييز بين نوافذ Coding Plan.
    - تتعامل لقطات الاستخدام مع `minimax`، و`minimax-cn`، و`minimax-portal`، و`minimax-portal-cn` باعتبارها سطح حصة MiniMax نفسه، وتفضّل بيانات OAuth المخزّنة لـ MiniMax قبل الرجوع إلى متغيرات البيئة لمفتاح Coding Plan.

  </Accordion>
</AccordionGroup>

## ملاحظات

- نموذج المحادثة الافتراضي: `MiniMax-M3`. نماذج المحادثة البديلة: `MiniMax-M2.7`، و`MiniMax-M2.7-highspeed`
- يكتب الإعداد الأولي وإعداد مفتاح API المباشر تعريفات النماذج لـ M3 ولكلا نسختي M2.7
- يستخدم فهم الصور مزوّد الوسائط `MiniMax-VL-01` المملوك للـ Plugin
- حدّث قيم التسعير في `models.json` إذا كنت تحتاج إلى تتبّع دقيق للتكلفة
- استخدم `openclaw models list` للتأكد من معرّف المزوّد الحالي، ثم بدّل باستخدام `openclaw models set minimax/MiniMax-M3` أو `openclaw models set minimax-portal/MiniMax-M3`

<Note>
راجع [مزوّدي النماذج](/ar/concepts/model-providers) للاطلاع على قواعد المزوّدين.
</Note>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title='"نموذج غير معروف: minimax/MiniMax-M3"'>
    يعني هذا عادةً أن **مزوّد MiniMax غير مُعدّ** (لا يوجد إدخال مزوّد مطابق، ولم يُعثر على ملف تعريف مصادقة أو مفتاح بيئة لـ MiniMax). أصلح ذلك عبر:

    - تشغيل `openclaw configure` وتحديد خيار مصادقة **MiniMax**، أو
    - إضافة كتلة `models.providers.minimax` أو `models.providers.minimax-portal` المطابقة يدويًا، أو
    - تعيين `MINIMAX_API_KEY` أو `MINIMAX_OAUTH_TOKEN` أو ملف تعريف مصادقة MiniMax، حتى يمكن حقن المزوّد المطابق.

    تأكد من أن معرّف النموذج **حساس لحالة الأحرف**:

    - مسار مفتاح API: ‏`minimax/MiniMax-M3`، أو `minimax/MiniMax-M2.7`، أو `minimax/MiniMax-M2.7-highspeed`
    - مسار OAuth: ‏`minimax-portal/MiniMax-M3`، أو `minimax-portal/MiniMax-M2.7`، أو `minimax-portal/MiniMax-M2.7-highspeed`

    ثم أعد التحقق باستخدام:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
لمزيد من المساعدة: [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) و[الأسئلة الشائعة](/ar/help/faq).
</Note>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك التحويل عند التعذّر.
  </Card>
  <Card title="إنشاء الصور" href="/ar/tools/image-generation" icon="image">
    معلمات أداة الصور المشتركة واختيار المزوّد.
  </Card>
  <Card title="إنشاء الموسيقى" href="/ar/tools/music-generation" icon="music">
    معلمات أداة الموسيقى المشتركة واختيار المزوّد.
  </Card>
  <Card title="إنشاء الفيديو" href="/ar/tools/video-generation" icon="video">
    معلمات أداة الفيديو المشتركة واختيار المزوّد.
  </Card>
  <Card title="بحث MiniMax" href="/ar/tools/minimax-search" icon="magnifying-glass">
    إعداد البحث على الويب عبر MiniMax Token Plan.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    استكشاف الأخطاء وإصلاحها والأسئلة الشائعة بشكل عام.
  </Card>
</CardGroup>
