---
read_when:
    - تريد نماذج MiniMax في OpenClaw
    - تحتاج إلى إرشادات إعداد MiniMax
summary: استخدام نماذج MiniMax في OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-05-02T07:40:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7c7aea4d9656d6ffddab7c43b06940e58bdd119a03b62000e689a3348f7df5a2
    source_path: providers/minimax.md
    workflow: 16
---

يستخدم مزوّد MiniMax في OpenClaw **MiniMax M2.7** افتراضيًا.

يوفّر MiniMax أيضًا:

- توليد كلام مضمّن عبر T2A v2
- فهم صور مضمّن عبر `MiniMax-VL-01`
- توليد موسيقى مضمّن عبر `music-2.6`
- `web_search` مضمّن عبر واجهة API للبحث في خطة رموز MiniMax

تقسيم المزوّد:

| معرّف المزوّد      | المصادقة    | القدرات                                                                                        |
| ---------------- | ------- | --------------------------------------------------------------------------------------------------- |
| `minimax`        | مفتاح API | نص، توليد صور، توليد موسيقى، توليد فيديو، فهم الصور، الكلام، بحث الويب |
| `minimax-portal` | OAuth   | نص، توليد صور، توليد موسيقى، توليد فيديو، فهم الصور، الكلام             |

## الفهرس المضمّن

| النموذج                    | النوع             | الوصف                              |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M2.7`           | دردشة (استدلال) | نموذج الاستدلال المستضاف الافتراضي           |
| `MiniMax-M2.7-highspeed` | دردشة (استدلال) | فئة استدلال M2.7 أسرع               |
| `MiniMax-VL-01`          | رؤية           | نموذج فهم الصور                |
| `image-01`               | توليد صور | تحويل النص إلى صورة وتحرير صورة إلى صورة |
| `music-2.6`              | توليد موسيقى | نموذج الموسيقى الافتراضي                      |
| `music-2.5`              | توليد موسيقى | فئة توليد الموسيقى السابقة           |
| `music-2.0`              | توليد موسيقى | فئة توليد الموسيقى القديمة             |
| `MiniMax-Hailuo-2.3`     | توليد فيديو | مسارات تحويل النص إلى فيديو ومرجع الصورة  |

## البدء

اختر طريقة المصادقة المفضلة لديك واتبع خطوات الإعداد.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **الأفضل لـ:** إعداد سريع باستخدام خطة MiniMax Coding Plan عبر OAuth، من دون الحاجة إلى مفتاح API.

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
    رابط إحالة لخطة MiniMax Coding Plan (خصم 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **الأفضل لـ:** MiniMax مستضاف مع واجهة API متوافقة مع Anthropic.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            يضبط هذا `api.minimax.io` باعتباره عنوان URL الأساسي.
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

            يضبط هذا `api.minimaxi.com` باعتباره عنوان URL الأساسي.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### مثال إعدادات

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
    على مسار البث المتوافق مع Anthropic، يعطّل OpenClaw تفكير MiniMax افتراضيًا ما لم تضبط `thinking` بنفسك صراحةً. تُصدر نقطة نهاية البث في MiniMax `reasoning_content` ضمن أجزاء دلتا بأسلوب OpenAI بدلًا من كتل التفكير الأصلية في Anthropic، ما قد يسرّب الاستدلال الداخلي إلى المخرجات المرئية إذا تُرك مفعّلًا ضمنيًا.
    </Warning>

    <Note>
    تستخدم إعدادات مفتاح API معرّف المزوّد `minimax`. تتبع مراجع النماذج الصيغة `minimax/MiniMax-M2.7`.
    </Note>

  </Tab>
</Tabs>

## الضبط عبر `openclaw configure`

استخدم معالج الإعدادات التفاعلي لضبط MiniMax من دون تحرير JSON:

<Steps>
  <Step title="تشغيل المعالج">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="تحديد النموذج/المصادقة">
    اختر **النموذج/المصادقة** من القائمة.
  </Step>
  <Step title="اختيار خيار مصادقة MiniMax">
    اختر أحد خيارات MiniMax المتاحة:

    | خيار المصادقة | الوصف |
    | --- | --- |
    | `minimax-global-oauth` | OAuth دولي (خطة الترميز) |
    | `minimax-cn-oauth` | OAuth الصين (خطة الترميز) |
    | `minimax-global-api` | مفتاح API دولي |
    | `minimax-cn-api` | مفتاح API الصين |

  </Step>
  <Step title="اختيار نموذجك الافتراضي">
    حدد نموذجك الافتراضي عند المطالبة.
  </Step>
</Steps>

## القدرات

### توليد الصور

يسجل Plugin MiniMax النموذج `image-01` للأداة `image_generate`. وهو يدعم:

- **توليد الصور من النص** مع التحكم في نسبة العرض إلى الارتفاع
- **تحرير الصور باستخدام صورة** (مرجع الموضوع) مع التحكم في نسبة العرض إلى الارتفاع
- ما يصل إلى **9 صور ناتجة** لكل طلب
- ما يصل إلى **صورة مرجعية واحدة** لكل طلب تحرير
- نسب العرض إلى الارتفاع المدعومة: `1:1`، `16:9`، `4:3`، `3:2`، `2:3`، `3:4`، `9:16`، `21:9`

لاستخدام MiniMax لتوليد الصور، عينه كمزود توليد الصور:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

يستخدم Plugin نفس `MINIMAX_API_KEY` أو مصادقة OAuth مثل نماذج النص. لا حاجة إلى أي إعداد إضافي إذا كان MiniMax قد أعد بالفعل.

يسجل كل من `minimax` و`minimax-portal` الأداة `image_generate` بالنموذج نفسه
`image-01`. تستخدم إعدادات مفتاح API المتغير `MINIMAX_API_KEY`؛ ويمكن لإعدادات OAuth استخدام
مسار مصادقة `minimax-portal` المضمن بدلا من ذلك.

يستخدم توليد الصور دائما نقطة نهاية الصور المخصصة في MiniMax
(`/v1/image_generation`) ويتجاهل `models.providers.minimax.baseUrl`،
لأن ذلك الحقل يهيئ عنوان URL الأساسي المتوافق مع الدردشة/Anthropic. عيّن
`MINIMAX_API_HOST=https://api.minimaxi.com` لتوجيه توليد الصور
عبر نقطة نهاية CN؛ نقطة النهاية العالمية الافتراضية هي
`https://api.minimax.io`.

عندما تكتب عملية التهيئة الأولية أو إعداد مفتاح API إدخالات `models.providers.minimax`
صريحة، يجسد OpenClaw النموذجين `MiniMax-M2.7` و
`MiniMax-M2.7-highspeed` كنماذج دردشة نصية فقط. أما فهم الصور
فيعرض بشكل منفصل عبر مزود الوسائط `MiniMax-VL-01` المملوك للـ Plugin.

<Note>
راجع [توليد الصور](/ar/tools/image-generation) للاطلاع على معلمات الأداة المشتركة، واختيار المزود، وسلوك تجاوز الفشل.
</Note>

### تحويل النص إلى كلام

يسجل Plugin `minimax` المضمن MiniMax T2A v2 كمزود كلام لـ
`messages.tts`.

- نموذج TTS الافتراضي: `speech-2.8-hd`
- الصوت الافتراضي: `English_expressive_narrator`
- تتضمن معرفات النماذج المضمنة المدعومة `speech-2.8-hd` و`speech-2.8-turbo`،
  و`speech-2.6-hd` و`speech-2.6-turbo` و`speech-02-hd`،
  و`speech-02-turbo` و`speech-01-hd` و`speech-01-turbo`.
- يتم حل المصادقة عبر `messages.tts.providers.minimax.apiKey`، ثم
  ملفات تعريف مصادقة OAuth/الرموز الخاصة بـ `minimax-portal`، ثم مفاتيح بيئة خطة الرموز
  (`MINIMAX_OAUTH_TOKEN`، `MINIMAX_CODE_PLAN_KEY`،
  `MINIMAX_CODING_API_KEY`)، ثم `MINIMAX_API_KEY`.
- إذا لم يهيأ مضيف TTS، يعيد OpenClaw استخدام مضيف OAuth المهيأ لـ
  `minimax-portal` ويزيل لواحق المسار المتوافقة مع Anthropic
  مثل `/anthropic`.
- تبقى مرفقات الصوت العادية بصيغة MP3.
- يتم تحويل أهداف الملاحظات الصوتية مثل Feishu وTelegram من MiniMax
  MP3 إلى Opus بتردد 48kHz باستخدام `ffmpeg`، لأن واجهة API للملفات في Feishu/Lark لا
  تقبل إلا `file_type: "opus"` للرسائل الصوتية الأصلية.
- يقبل MiniMax T2A القيم الكسرية لـ `speed` و`vol`، لكن `pitch` يرسل
  كعدد صحيح؛ يقتطع OpenClaw قيم `pitch` الكسرية قبل طلب API.

| الإعداد                                  | متغير البيئة                | الافتراضي                       | الوصف                      |
| ---------------------------------------- | ---------------------- | ----------------------------- | -------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | مضيف API الخاص بـ MiniMax T2A.            |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | معرف نموذج TTS.                    |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | معرف الصوت المستخدم لإخراج الكلام. |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | سرعة التشغيل، `0.5..2.0`.      |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | مستوى الصوت، `(0, 10]`.               |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | إزاحة حدة الصوت بعدد صحيح، `-12..12`.  |

### توليد الموسيقى

يسجل Plugin MiniMax المضمن توليد الموسيقى عبر الأداة المشتركة
`music_generate` لكل من `minimax` و`minimax-portal`.

- نموذج الموسيقى الافتراضي: `minimax/music-2.6`
- نموذج الموسيقى OAuth: `minimax-portal/music-2.6`
- يدعم أيضا `minimax/music-2.5` و`minimax/music-2.0`
- عناصر التحكم في الموجه: `lyrics`، `instrumental`، `durationSeconds`
- صيغة الإخراج: `mp3`
- تنفصل عمليات التشغيل المدعومة بالجلسة عبر تدفق المهام/الحالة المشترك، بما في ذلك `action: "status"`

لاستخدام MiniMax كمزود الموسيقى الافتراضي:

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
راجع [توليد الموسيقى](/ar/tools/music-generation) للاطلاع على معلمات الأداة المشتركة، واختيار المزود، وسلوك تجاوز الفشل.
</Note>

### توليد الفيديو

يسجل Plugin MiniMax المضمن توليد الفيديو عبر الأداة المشتركة
`video_generate` لكل من `minimax` و`minimax-portal`.

- نموذج الفيديو الافتراضي: `minimax/MiniMax-Hailuo-2.3`
- نموذج الفيديو OAuth: `minimax-portal/MiniMax-Hailuo-2.3`
- الأوضاع: تدفقات تحويل النص إلى فيديو وتدفقات مرجع الصورة الواحدة
- يدعم `aspectRatio` و`resolution`

لاستخدام MiniMax كمزود الفيديو الافتراضي:

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
راجع [توليد الفيديو](/ar/tools/video-generation) لمعرفة معاملات الأداة المشتركة، واختيار المزوّد، وسلوك تجاوز الفشل.
</Note>

### فهم الصور

يسجّل MiniMax Plugin فهم الصور بشكل منفصل عن كتالوج النص:

| معرّف المزوّد      | نموذج الصور الافتراضي |
| ---------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     |
| `minimax-portal` | `MiniMax-VL-01`     |

لهذا السبب يمكن لتوجيه الوسائط التلقائي استخدام فهم الصور من MiniMax حتى عندما يظل كتالوج مزوّد النصوص المضمّن يعرض مراجع دردشة M2.7 النصية فقط.

### بحث الويب

يسجّل MiniMax Plugin أيضًا `web_search` عبر واجهة برمجة تطبيقات البحث MiniMax Token Plan.

- معرّف المزوّد: `minimax`
- النتائج المنظمة: العناوين، وعناوين URL، والمقتطفات، والاستعلامات ذات الصلة
- متغير البيئة المفضّل: `MINIMAX_CODE_PLAN_KEY`
- أسماء بيئة بديلة مقبولة: `MINIMAX_CODING_API_KEY`، `MINIMAX_OAUTH_TOKEN`
- احتياطي التوافق: `MINIMAX_API_KEY` عندما يشير بالفعل إلى اعتماد token-plan
- إعادة استخدام المنطقة: `plugins.entries.minimax.config.webSearch.region`، ثم `MINIMAX_API_HOST`، ثم عناوين URL الأساسية لمزوّد MiniMax
- يبقى البحث على معرّف المزوّد `minimax`؛ ويمكن لإعداد OAuth في CN/العالمي توجيه المنطقة بشكل غير مباشر عبر `models.providers.minimax-portal.baseUrl` ويمكنه توفير مصادقة bearer عبر `MINIMAX_OAUTH_TOKEN`

يوجد الإعداد ضمن `plugins.entries.minimax.config.webSearch.*`.

<Note>
راجع [بحث MiniMax](/ar/tools/minimax-search) للاطلاع على إعداد بحث الويب الكامل واستخدامه.
</Note>

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="خيارات الإعداد">
    | الخيار | الوصف |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | يفضّل استخدام `https://api.minimax.io/anthropic` (متوافق مع Anthropic)؛ ويكون `https://api.minimax.io/v1` اختياريًا للحمولات المتوافقة مع OpenAI |
    | `models.providers.minimax.api` | يفضّل استخدام `anthropic-messages`؛ ويكون `openai-completions` اختياريًا للحمولات المتوافقة مع OpenAI |
    | `models.providers.minimax.apiKey` | مفتاح واجهة برمجة تطبيقات MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | عرّف `id`، و`name`، و`reasoning`، و`contextWindow`، و`maxTokens`، و`cost` |
    | `agents.defaults.models` | أضف أسماء مستعارة للنماذج التي تريدها في قائمة السماح |
    | `models.mode` | أبقِ `merge` إذا كنت تريد إضافة MiniMax إلى جانب العناصر المضمّنة |
  </Accordion>

  <Accordion title="إعدادات التفكير الافتراضية">
    في `api: "anthropic-messages"`، يحقن OpenClaw القيمة `thinking: { type: "disabled" }` ما لم يكن التفكير معيّنًا صراحةً بالفعل في المعلمات/الإعداد.

    يمنع هذا نقطة نهاية البث في MiniMax من إصدار `reasoning_content` في مقاطع delta بأسلوب OpenAI، ما قد يسرّب الاستدلال الداخلي إلى المخرجات المرئية.

  </Accordion>

  <Accordion title="الوضع السريع">
    يعيد `/fast on` أو `params.fastMode: true` كتابة `MiniMax-M2.7` إلى `MiniMax-M2.7-highspeed` في مسار البث المتوافق مع Anthropic.
  </Accordion>

  <Accordion title="مثال احتياطي">
    **الأفضل لـ:** إبقاء أقوى نموذج من الجيل الأحدث لديك كنموذج أساسي، مع تجاوز الفشل إلى MiniMax M2.7. يستخدم المثال أدناه Opus كنموذج أساسي محدد؛ استبدله بالنموذج الأساسي المفضّل لديك من أحدث جيل.

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
    - واجهة برمجة تطبيقات استخدام Coding Plan: `https://api.minimaxi.com/v1/token_plan/remains` أو `https://api.minimax.io/v1/token_plan/remains` (تتطلب مفتاح coding plan).
    - يستنتج استطلاع الاستخدام المضيف من `models.providers.minimax-portal.baseUrl` أو `models.providers.minimax.baseUrl` عند تهيئته، لذلك تستطلع الإعدادات العالمية التي تستخدم `https://api.minimax.io/anthropic` المضيف `api.minimax.io`. تُبقي عناوين URL الأساسية المفقودة أو المشوّهة الاحتياطي CN من أجل التوافق.
    - يطبّع OpenClaw استخدام MiniMax coding-plan إلى عرض `% left` نفسه المستخدم لدى المزوّدين الآخرين. حقول MiniMax الخام `usage_percent` / `usagePercent` تمثل الحصة المتبقية، وليس الحصة المستهلكة، لذلك يعكسها OpenClaw. تتقدّم الحقول القائمة على العد عند وجودها.
    - عندما تعيد واجهة برمجة التطبيقات `model_remains`، يفضّل OpenClaw إدخال نموذج الدردشة، ويستنتج تسمية النافذة من `start_time` / `end_time` عند الحاجة، ويتضمن اسم النموذج المحدد في تسمية الخطة لتسهيل تمييز نوافذ coding-plan.
    - تتعامل لقطات الاستخدام مع `minimax`، و`minimax-cn`، و`minimax-portal` كسطح حصة MiniMax نفسه، وتفضّل MiniMax OAuth المخزّن قبل الرجوع إلى متغيرات بيئة مفتاح Coding Plan.

  </Accordion>
</AccordionGroup>

## ملاحظات

- تتبع مراجع النماذج مسار المصادقة:
  - إعداد مفتاح واجهة برمجة التطبيقات: `minimax/<model>`
  - إعداد OAuth: `minimax-portal/<model>`
- نموذج الدردشة الافتراضي: `MiniMax-M2.7`
- نموذج الدردشة البديل: `MiniMax-M2.7-highspeed`
- يكتب الإعداد التمهيدي وإعداد مفتاح واجهة برمجة التطبيقات المباشر تعريفات نماذج نصية فقط لكلتا نسختي M2.7
- يستخدم فهم الصور مزوّد وسائط `MiniMax-VL-01` المملوك للـ Plugin
- حدّث قيم التسعير في `models.json` إذا كنت تحتاج إلى تتبع دقيق للتكلفة
- استخدم `openclaw models list` لتأكيد معرّف المزوّد الحالي، ثم بدّل باستخدام `openclaw models set minimax/MiniMax-M2.7` أو `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
رابط إحالة لخطة MiniMax Coding Plan (خصم 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
راجع [مزوّدو النماذج](/ar/concepts/model-providers) لمعرفة قواعد المزوّدين.
</Note>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title='"نموذج غير معروف: minimax/MiniMax-M2.7"'>
    يعني هذا عادةً أن **مزوّد MiniMax غير مهيّأ** (لا يوجد إدخال مزوّد مطابق ولا ملف مصادقة/مفتاح بيئة MiniMax مطابق). يوجد إصلاح لهذا الاكتشاف في **2026.1.12**. أصلح ذلك عبر:

    - الترقية إلى **2026.1.12** (أو التشغيل من المصدر `main`)، ثم إعادة تشغيل Gateway.
    - تشغيل `openclaw configure` واختيار خيار مصادقة **MiniMax**، أو
    - إضافة كتلة `models.providers.minimax` أو `models.providers.minimax-portal` المطابقة يدويًا، أو
    - تعيين `MINIMAX_API_KEY` أو `MINIMAX_OAUTH_TOKEN` أو ملف مصادقة MiniMax بحيث يمكن حقن المزوّد المطابق.

    تأكد من أن معرّف النموذج **حساس لحالة الأحرف**:

    - مسار مفتاح واجهة برمجة التطبيقات: `minimax/MiniMax-M2.7` أو `minimax/MiniMax-M2.7-highspeed`
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

## ذات صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك تجاوز الفشل.
  </Card>
  <Card title="توليد الصور" href="/ar/tools/image-generation" icon="image">
    معاملات أداة الصور المشتركة واختيار المزوّد.
  </Card>
  <Card title="توليد الموسيقى" href="/ar/tools/music-generation" icon="music">
    معاملات أداة الموسيقى المشتركة واختيار المزوّد.
  </Card>
  <Card title="توليد الفيديو" href="/ar/tools/video-generation" icon="video">
    معاملات أداة الفيديو المشتركة واختيار المزوّد.
  </Card>
  <Card title="بحث MiniMax" href="/ar/tools/minimax-search" icon="magnifying-glass">
    إعداد بحث الويب عبر MiniMax Token Plan.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    استكشاف الأخطاء العام والأسئلة الشائعة.
  </Card>
</CardGroup>
