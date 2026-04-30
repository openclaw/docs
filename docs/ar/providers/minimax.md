---
read_when:
    - تريد نماذج MiniMax في OpenClaw
    - تحتاج إلى إرشادات لإعداد MiniMax
summary: استخدام نماذج MiniMax في OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-30T08:21:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0ef833258692c78f40a160131c2a0d36f84889e5d5196ddadb648485ba8cb04a
    source_path: providers/minimax.md
    workflow: 16
---

يستخدم مزوّد MiniMax في OpenClaw **MiniMax M2.7** افتراضيًا.

يوفّر MiniMax أيضًا:

- تركيب كلام مضمّن عبر T2A v2
- فهم صور مضمّن عبر `MiniMax-VL-01`
- توليد موسيقى مضمّن عبر `music-2.6`
- `web_search` مضمّن من خلال API البحث في MiniMax Coding Plan

تقسيم المزوّدين:

| معرّف المزوّد      | المصادقة    | القدرات                                                                                        |
| ---------------- | ------- | --------------------------------------------------------------------------------------------------- |
| `minimax`        | مفتاح API | نص، توليد صور، توليد موسيقى، توليد فيديو، فهم الصور، كلام، بحث ويب |
| `minimax-portal` | OAuth   | نص، توليد صور، توليد موسيقى، توليد فيديو، فهم الصور، كلام             |

## الكتالوج المضمّن

| النموذج                    | النوع             | الوصف                              |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M2.7`           | دردشة (استدلال) | نموذج الاستدلال المستضاف الافتراضي           |
| `MiniMax-M2.7-highspeed` | دردشة (استدلال) | طبقة استدلال M2.7 أسرع               |
| `MiniMax-VL-01`          | رؤية           | نموذج فهم الصور                |
| `image-01`               | توليد صور | تحرير نص إلى صورة وصورة إلى صورة |
| `music-2.6`              | توليد موسيقى | نموذج الموسيقى الافتراضي                      |
| `music-2.5`              | توليد موسيقى | طبقة توليد الموسيقى السابقة           |
| `music-2.0`              | توليد موسيقى | طبقة توليد الموسيقى القديمة             |
| `MiniMax-Hailuo-2.3`     | توليد فيديو | تدفقات نص إلى فيديو ومراجع الصور  |

## البدء

اختر طريقة المصادقة المفضلة لديك واتبع خطوات الإعداد.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **الأفضل لـ:** إعداد سريع مع MiniMax Coding Plan عبر OAuth، من دون الحاجة إلى مفتاح API.

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
    تستخدم إعدادات OAuth معرّف المزوّد `minimax-portal`. تتبع مراجع النماذج الصيغة `minimax-portal/MiniMax-M2.7`.
    </Note>

    <Tip>
    رابط إحالة لـ MiniMax Coding Plan (خصم 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **الأفضل لـ:** MiniMax المستضاف مع API متوافق مع Anthropic.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            يضبط هذا `api.minimax.io` كعنوان URL الأساسي.
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

            يضبط هذا `api.minimaxi.com` كعنوان URL الأساسي.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### مثال تهيئة

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "minimax/MiniMax-M2.7" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
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
    على مسار البث المتوافق مع Anthropic، يعطّل OpenClaw تفكير MiniMax افتراضيًا ما لم تضبط `thinking` بنفسك صراحةً. تصدر نقطة نهاية البث في MiniMax محتوى `reasoning_content` في أجزاء دلتا بأسلوب OpenAI بدلًا من كتل التفكير الأصلية في Anthropic، ما قد يسرّب الاستدلال الداخلي إلى المخرجات المرئية إذا تُرك مفعّلًا ضمنيًا.
    </Warning>

    <Note>
    تستخدم إعدادات مفتاح API معرّف المزوّد `minimax`. تتبع مراجع النماذج الصيغة `minimax/MiniMax-M2.7`.
    </Note>

  </Tab>
</Tabs>

## التهيئة عبر `openclaw configure`

استخدم معالج التهيئة التفاعلي لضبط MiniMax من دون تحرير JSON:

<Steps>
  <Step title="تشغيل المعالج">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="اختيار النموذج/المصادقة">
    اختر **النموذج/المصادقة** من القائمة.
  </Step>
  <Step title="اختيار خيار مصادقة MiniMax">
    اختر أحد خيارات MiniMax المتاحة:

    | خيار المصادقة | الوصف |
    | --- | --- |
    | `minimax-global-oauth` | OAuth دولي (خطة البرمجة) |
    | `minimax-cn-oauth` | OAuth الصين (خطة البرمجة) |
    | `minimax-global-api` | مفتاح API دولي |
    | `minimax-cn-api` | مفتاح API الصين |

  </Step>
  <Step title="اختيار نموذجك الافتراضي">
    حدد نموذجك الافتراضي عند المطالبة.
  </Step>
</Steps>

## الإمكانات

### توليد الصور

يسجل Plugin MiniMax النموذج `image-01` لأداة `image_generate`. وهو يدعم:

- **توليد الصور من النص** مع التحكم في نسبة العرض إلى الارتفاع
- **تحرير صورة إلى صورة** (مرجع الموضوع) مع التحكم في نسبة العرض إلى الارتفاع
- ما يصل إلى **9 صور إخراج** لكل طلب
- ما يصل إلى **صورة مرجعية واحدة** لكل طلب تحرير
- نسب العرض إلى الارتفاع المدعومة: `1:1`، `16:9`، `4:3`، `3:2`، `2:3`، `3:4`، `9:16`، `21:9`

لاستخدام MiniMax لتوليد الصور، عينه كموفر توليد الصور:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

يستخدم Plugin نفس `MINIMAX_API_KEY` أو مصادقة OAuth مثل نماذج النص. لا يلزم أي تكوين إضافي إذا كان MiniMax معدا بالفعل.

يسجل كل من `minimax` و`minimax-portal` الأداة `image_generate` باستخدام نموذج
`image-01` نفسه. تستخدم إعدادات مفتاح API `MINIMAX_API_KEY`؛ ويمكن لإعدادات OAuth استخدام
مسار مصادقة `minimax-portal` المضمن بدلا من ذلك.

يستخدم توليد الصور دائما نقطة نهاية الصور المخصصة من MiniMax
(`/v1/image_generation`) ويتجاهل `models.providers.minimax.baseUrl`،
لأن هذا الحقل يكوّن عنوان URL الأساسي المتوافق مع الدردشة/Anthropic. عيّن
`MINIMAX_API_HOST=https://api.minimaxi.com` لتوجيه توليد الصور
عبر نقطة نهاية CN؛ نقطة النهاية العالمية الافتراضية هي
`https://api.minimax.io`.

عندما تكتب عملية التهيئة الأولية أو إعداد مفتاح API إدخالات `models.providers.minimax`
صريحة، ينشئ OpenClaw النموذجين `MiniMax-M2.7` و
`MiniMax-M2.7-highspeed` كنماذج دردشة نصية فقط. ويعرض فهم الصور
بشكل منفصل من خلال موفر الوسائط `MiniMax-VL-01` المملوك للـ Plugin.

<Note>
راجع [توليد الصور](/ar/tools/image-generation) لمعلمات الأداة المشتركة، واختيار الموفر، وسلوك تجاوز الفشل.
</Note>

### تحويل النص إلى كلام

يسجل Plugin `minimax` المضمن MiniMax T2A v2 كموفر كلام لـ
`messages.tts`.

- نموذج TTS الافتراضي: `speech-2.8-hd`
- الصوت الافتراضي: `English_expressive_narrator`
- تتضمن معرفات النماذج المضمنة المدعومة `speech-2.8-hd` و`speech-2.8-turbo` و
  `speech-2.6-hd` و`speech-2.6-turbo` و`speech-02-hd` و
  `speech-02-turbo` و`speech-01-hd` و`speech-01-turbo`.
- ترتيب حل المصادقة هو `messages.tts.providers.minimax.apiKey`، ثم
  ملفات تعريف مصادقة OAuth/الرمز المميز الخاصة بـ `minimax-portal`، ثم مفاتيح بيئة
  خطة Token (`MINIMAX_OAUTH_TOKEN`، `MINIMAX_CODE_PLAN_KEY`،
  `MINIMAX_CODING_API_KEY`)، ثم `MINIMAX_API_KEY`.
- إذا لم تتم تهيئة مضيف TTS، يعيد OpenClaw استخدام مضيف OAuth
  المهيأ لـ `minimax-portal` ويزيل لواحق المسار المتوافقة مع Anthropic
  مثل `/anthropic`.
- تبقى مرفقات الصوت العادية بصيغة MP3.
- أهداف الملاحظات الصوتية مثل Feishu وTelegram يتم تحويلها من MiniMax
  MP3 إلى Opus بتردد 48kHz باستخدام `ffmpeg`، لأن واجهة API للملفات في Feishu/Lark لا
  تقبل إلا `file_type: "opus"` للرسائل الصوتية الأصلية.
- يقبل MiniMax T2A قيم `speed` و`vol` الكسرية، لكن يتم إرسال `pitch` كعدد
  صحيح؛ يقتطع OpenClaw قيم `pitch` الكسرية قبل طلب API.

| الإعداد                                  | متغير البيئة                | الافتراضي                       | الوصف                      |
| ---------------------------------------- | ---------------------- | ----------------------------- | -------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | مضيف API لـ MiniMax T2A.            |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | معرف نموذج TTS.                    |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | معرف الصوت المستخدم لإخراج الكلام. |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | سرعة التشغيل، `0.5..2.0`.      |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | مستوى الصوت، `(0, 10]`.               |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | إزاحة طبقة الصوت بعدد صحيح، `-12..12`.  |

### توليد الموسيقى

يسجل Plugin MiniMax المضمن توليد الموسيقى من خلال أداة
`music_generate` المشتركة لكل من `minimax` و`minimax-portal`.

- نموذج الموسيقى الافتراضي: `minimax/music-2.6`
- نموذج موسيقى OAuth: `minimax-portal/music-2.6`
- يدعم أيضا `minimax/music-2.5` و`minimax/music-2.0`
- عناصر التحكم في المطالبة: `lyrics`، `instrumental`، `durationSeconds`
- تنسيق الإخراج: `mp3`
- تنفصل عمليات التشغيل المدعومة بالجلسات عبر تدفق المهمة/الحالة المشترك، بما في ذلك `action: "status"`

لاستخدام MiniMax كموفر الموسيقى الافتراضي:

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
راجع [توليد الموسيقى](/ar/tools/music-generation) لمعلمات الأداة المشتركة، واختيار الموفر، وسلوك تجاوز الفشل.
</Note>

### توليد الفيديو

يسجل Plugin MiniMax المضمن توليد الفيديو من خلال أداة
`video_generate` المشتركة لكل من `minimax` و`minimax-portal`.

- نموذج الفيديو الافتراضي: `minimax/MiniMax-Hailuo-2.3`
- نموذج فيديو OAuth: `minimax-portal/MiniMax-Hailuo-2.3`
- الأوضاع: تدفقات تحويل النص إلى فيديو ومرجع الصورة الواحدة
- يدعم `aspectRatio` و`resolution`

لاستخدام MiniMax كموفر الفيديو الافتراضي:

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
راجع [إنشاء الفيديو](/ar/tools/video-generation) لمعرفة معلمات الأداة المشتركة، واختيار المزوّد، وسلوك تجاوز الفشل.
</Note>

### فهم الصور

يسجّل MiniMax plugin فهم الصور بشكل منفصل عن كتالوج النصوص:

| معرّف المزوّد    | نموذج الصور الافتراضي |
| ---------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     |
| `minimax-portal` | `MiniMax-VL-01`     |

لهذا السبب يمكن للتوجيه التلقائي للوسائط استخدام فهم الصور في MiniMax حتى
عندما لا يزال كتالوج مزوّد النصوص المضمّن يعرض مراجع محادثة M2.7 النصية فقط.

### بحث الويب

يسجّل MiniMax plugin أيضًا `web_search` عبر واجهة API للبحث في MiniMax Coding Plan.

- معرّف المزوّد: `minimax`
- النتائج المنظّمة: العناوين، عناوين URL، المقتطفات، الاستعلامات ذات الصلة
- متغيّر البيئة المفضّل: `MINIMAX_CODE_PLAN_KEY`
- الاسم البديل المقبول للبيئة: `MINIMAX_CODING_API_KEY`
- احتياطي التوافق: `MINIMAX_API_KEY` عندما يشير أصلًا إلى رمز coding-plan
- إعادة استخدام المنطقة: `plugins.entries.minimax.config.webSearch.region`، ثم `MINIMAX_API_HOST`، ثم عناوين URL الأساسية لمزوّد MiniMax
- يبقى البحث على معرّف المزوّد `minimax`؛ ولا يزال إعداد OAuth للصين/العالمي قادرًا على توجيه المنطقة بشكل غير مباشر عبر `models.providers.minimax-portal.baseUrl`

يوجد الإعداد ضمن `plugins.entries.minimax.config.webSearch.*`.

<Note>
راجع [بحث MiniMax](/ar/tools/minimax-search) للاطلاع على الإعداد الكامل لبحث الويب واستخدامه.
</Note>

## الإعداد المتقدّم

<AccordionGroup>
  <Accordion title="خيارات الإعداد">
    | الخيار | الوصف |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | يُفضّل `https://api.minimax.io/anthropic` (متوافق مع Anthropic)؛ `https://api.minimax.io/v1` اختياري للحمولات المتوافقة مع OpenAI |
    | `models.providers.minimax.api` | يُفضّل `anthropic-messages`؛ `openai-completions` اختياري للحمولات المتوافقة مع OpenAI |
    | `models.providers.minimax.apiKey` | مفتاح MiniMax API (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | عرّف `id` و`name` و`reasoning` و`contextWindow` و`maxTokens` و`cost` |
    | `agents.defaults.models` | امنح النماذج التي تريدها في قائمة السماح أسماءً بديلة |
    | `models.mode` | أبقِ `merge` إذا كنت تريد إضافة MiniMax إلى جانب المضمّنات |
  </Accordion>

  <Accordion title="افتراضيات التفكير">
    في `api: "anthropic-messages"`، يحقن OpenClaw القيمة `thinking: { type: "disabled" }` ما لم يكن التفكير مضبوطًا صراحةً مسبقًا في المعلمات/الإعداد.

    يمنع هذا نقطة نهاية البث في MiniMax من إصدار `reasoning_content` ضمن أجزاء دلتا بأسلوب OpenAI، ما قد يسرّب الاستدلال الداخلي إلى المخرجات المرئية.

  </Accordion>

  <Accordion title="الوضع السريع">
    يعيد `/fast on` أو `params.fastMode: true` كتابة `MiniMax-M2.7` إلى `MiniMax-M2.7-highspeed` على مسار البث المتوافق مع Anthropic.
  </Accordion>

  <Accordion title="مثال احتياطي">
    **الأفضل لـ:** إبقاء أقوى نموذج من أحدث جيل لديك كنموذج أساسي، مع تجاوز الفشل إلى MiniMax M2.7. يستخدم المثال أدناه Opus كنموذج أساسي ملموس؛ استبدله بالنموذج الأساسي المفضّل لديك من أحدث جيل.

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
    - واجهة API لاستخدام Coding Plan: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (تتطلب مفتاح coding plan).
    - يطبّع OpenClaw استخدام coding-plan في MiniMax إلى عرض `% left` نفسه المستخدم لدى المزوّدين الآخرين. حقول MiniMax الخام `usage_percent` / `usagePercent` تمثّل الحصة المتبقية، لا الحصة المستهلكة، لذلك يعكسها OpenClaw. تتقدّم الحقول القائمة على العدّ عند وجودها.
    - عندما تعيد واجهة API القيمة `model_remains`، يفضّل OpenClaw إدخال نموذج المحادثة، ويشتق تسمية النافذة من `start_time` / `end_time` عند الحاجة، ويضمّن اسم النموذج المحدد في تسمية الخطة لتسهيل تمييز نوافذ coding-plan.
    - تتعامل لقطات الاستخدام مع `minimax` و`minimax-cn` و`minimax-portal` كسطح حصة MiniMax نفسه، وتفضّل MiniMax OAuth المخزّن قبل الرجوع إلى متغيّرات البيئة الخاصة بمفتاح Coding Plan.

  </Accordion>
</AccordionGroup>

## ملاحظات

- تتبع مراجع النماذج مسار المصادقة:
  - إعداد مفتاح API: `minimax/<model>`
  - إعداد OAuth: `minimax-portal/<model>`
- نموذج المحادثة الافتراضي: `MiniMax-M2.7`
- نموذج المحادثة البديل: `MiniMax-M2.7-highspeed`
- تكتب عملية الإعداد الأولي والإعداد المباشر بمفتاح API تعريفات نماذج نصية فقط لكلا متغيّري M2.7
- يستخدم فهم الصور مزوّد الوسائط `MiniMax-VL-01` المملوك للـ plugin
- حدّث قيم التسعير في `models.json` إذا كنت تحتاج إلى تتبع دقيق للتكلفة
- استخدم `openclaw models list` لتأكيد معرّف المزوّد الحالي، ثم بدّل باستخدام `openclaw models set minimax/MiniMax-M2.7` أو `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
رابط إحالة لـ MiniMax Coding Plan (خصم 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
راجع [مزوّدو النماذج](/ar/concepts/model-providers) لمعرفة قواعد المزوّدين.
</Note>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title='"نموذج غير معروف: minimax/MiniMax-M2.7"'>
    يعني هذا عادةً أن **مزوّد MiniMax غير معدّ** (لا يوجد إدخال مزوّد مطابق ولا ملف مصادقة/مفتاح بيئة لـ MiniMax). يوجد إصلاح لهذا الاكتشاف في **2026.1.12**. أصلح ذلك عبر:

    - الترقية إلى **2026.1.12** (أو التشغيل من المصدر `main`)، ثم إعادة تشغيل Gateway.
    - تشغيل `openclaw configure` واختيار خيار مصادقة **MiniMax**، أو
    - إضافة كتلة `models.providers.minimax` أو `models.providers.minimax-portal` المطابقة يدويًا، أو
    - ضبط `MINIMAX_API_KEY` أو `MINIMAX_OAUTH_TOKEN` أو ملف مصادقة MiniMax بحيث يمكن حقن المزوّد المطابق.

    تأكد من أن معرّف النموذج **حساس لحالة الأحرف**:

    - مسار مفتاح API: `minimax/MiniMax-M2.7` أو `minimax/MiniMax-M2.7-highspeed`
    - مسار OAuth: `minimax-portal/MiniMax-M2.7` أو `minimax-portal/MiniMax-M2.7-highspeed`

    ثم أعد التحقق باستخدام:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
مزيد من المساعدة: [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) و[الأسئلة الشائعة](/ar/help/faq).
</Note>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك تجاوز الفشل.
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
    إعداد بحث الويب عبر MiniMax Coding Plan.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    الاستكشاف العام للأخطاء وإصلاحها والأسئلة الشائعة.
  </Card>
</CardGroup>
