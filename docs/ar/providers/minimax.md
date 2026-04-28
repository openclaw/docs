---
read_when:
    - تريد Models الخاصة بـ MiniMax في OpenClaw
    - تحتاج إلى إرشادات إعداد MiniMax
summary: استخدم Models الخاصة بـ MiniMax في OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-26T11:39:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b91f8c4c12c993457fb1535bbb2f3401474a3ec432b24189792a20041e756dc
    source_path: providers/minimax.md
    workflow: 15
---

يستخدم provider الخاص بـ MiniMax في OpenClaw افتراضيًا **MiniMax M2.7**.

كما يوفّر MiniMax أيضًا:

- توليد كلام مضمّن عبر T2A v2
- فهم صور مضمّن عبر `MiniMax-VL-01`
- توليد موسيقى مضمّن عبر `music-2.6`
- أداة `web_search` مضمّنة عبر MiniMax Coding Plan search API

تقسيم provider:

| معرّف Provider   | المصادقة | القدرات                                                                                          |
| ---------------- | -------- | ------------------------------------------------------------------------------------------------ |
| `minimax`        | API key  | النص، وإنشاء الصور، وإنشاء الموسيقى، وإنشاء الفيديو، وفهم الصور، والكلام، والبحث على الويب      |
| `minimax-portal` | OAuth    | النص، وإنشاء الصور، وإنشاء الموسيقى، وإنشاء الفيديو، وفهم الصور، والكلام                         |

## الفهرس المضمّن

| Model                    | النوع            | الوصف                                     |
| ------------------------ | ---------------- | ----------------------------------------- |
| `MiniMax-M2.7`           | دردشة (استدلال)  | model الاستدلالي المستضاف الافتراضي      |
| `MiniMax-M2.7-highspeed` | دردشة (استدلال)  | مستوى استدلال M2.7 أسرع                  |
| `MiniMax-VL-01`          | رؤية             | model فهم الصور                           |
| `image-01`               | إنشاء صور        | نص إلى صورة وتحرير صورة إلى صورة         |
| `music-2.6`              | إنشاء موسيقى     | model الموسيقى الافتراضي                 |
| `music-2.5`              | إنشاء موسيقى     | مستوى سابق لإنشاء الموسيقى               |
| `music-2.0`              | إنشاء موسيقى     | مستوى قديم لإنشاء الموسيقى               |
| `MiniMax-Hailuo-2.3`     | إنشاء فيديو      | تدفقات النص إلى فيديو والمراجع الصورية   |

## البدء

اختر طريقة المصادقة المفضلة لديك واتبع خطوات الإعداد.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **الأفضل لـ:** إعداد سريع مع MiniMax Coding Plan عبر OAuth، من دون الحاجة إلى API key.

    <Tabs>
      <Tab title="دولي">
        <Steps>
          <Step title="شغّل الإعداد الأوّلي">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            يقوم هذا بالمصادقة على `api.minimax.io`.
          </Step>
          <Step title="تحقق من توفر model">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="الصين">
        <Steps>
          <Step title="شغّل الإعداد الأوّلي">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            يقوم هذا بالمصادقة على `api.minimaxi.com`.
          </Step>
          <Step title="تحقق من توفر model">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    تستخدم إعدادات OAuth معرّف provider ‏`minimax-portal`. وتتبع مراجع Models الصيغة `minimax-portal/MiniMax-M2.7`.
    </Note>

    <Tip>
    رابط إحالة لـ MiniMax Coding Plan ‏(خصم 10٪): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **الأفضل لـ:** MiniMax المستضاف مع API متوافقة مع Anthropic.

    <Tabs>
      <Tab title="دولي">
        <Steps>
          <Step title="شغّل الإعداد الأوّلي">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            يهيّئ هذا `api.minimax.io` كعنوان URL أساسي.
          </Step>
          <Step title="تحقق من توفر model">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="الصين">
        <Steps>
          <Step title="شغّل الإعداد الأوّلي">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            يهيّئ هذا `api.minimaxi.com` كعنوان URL أساسي.
          </Step>
          <Step title="تحقق من توفر model">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### مثال على الإعدادات

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
    على مسار البث المتوافق مع Anthropic، يعطّل OpenClaw التفكير في MiniMax افتراضيًا ما لم تضبط `thinking` بنفسك صراحةً. إذ تُصدر نقطة نهاية البث في MiniMax الحقل `reasoning_content` على شكل أجزاء delta بنمط OpenAI بدل كتل التفكير الأصلية الخاصة بـ Anthropic، ما قد يؤدي إلى تسرب الاستدلال الداخلي إلى المخرجات المرئية إذا تُرك مفعّلًا ضمنيًا.
    </Warning>

    <Note>
    تستخدم إعدادات API key معرّف provider ‏`minimax`. وتتبع مراجع Models الصيغة `minimax/MiniMax-M2.7`.
    </Note>

  </Tab>
</Tabs>

## التهيئة عبر `openclaw configure`

استخدم معالج الإعدادات التفاعلي لضبط MiniMax من دون تحرير JSON:

<Steps>
  <Step title="شغّل المعالج">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="اختر Model/auth">
    اختر **Model/auth** من القائمة.
  </Step>
  <Step title="اختر أحد خيارات مصادقة MiniMax">
    اختر أحد خيارات MiniMax المتاحة:

    | خيار المصادقة | الوصف |
    | --- | --- |
    | `minimax-global-oauth` | OAuth دولية (Coding Plan) |
    | `minimax-cn-oauth` | OAuth للصين (Coding Plan) |
    | `minimax-global-api` | API key دولية |
    | `minimax-cn-api` | API key للصين |

  </Step>
  <Step title="اختر Model الافتراضية">
    اختر Model الافتراضية عند ظهور الطلب.
  </Step>
</Steps>

## الإمكانات

### إنشاء الصور

يسجّل Plugin الخاص بـ MiniMax الـ model `image-01` لأداة `image_generate`. وهو يدعم:

- **إنشاء صور من نص** مع التحكم في نسبة الأبعاد
- **تحرير صورة إلى صورة** (مرجع موضوع) مع التحكم في نسبة الأبعاد
- ما يصل إلى **9 صور ناتجة** لكل طلب
- ما يصل إلى **صورة مرجعية واحدة** لكل طلب تحرير
- نسب الأبعاد المدعومة: `1:1` و`16:9` و`4:3` و`3:2` و`2:3` و`3:4` و`9:16` و`21:9`

لاستخدام MiniMax في إنشاء الصور، اضبطه كـ provider لإنشاء الصور:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

يستخدم Plugin المصادقة نفسها `MINIMAX_API_KEY` أو OAuth كما في Models النصية. ولا توجد حاجة إلى إعدادات إضافية إذا كان MiniMax مضبوطًا بالفعل.

يسجّل كل من `minimax` و`minimax-portal` الأداة `image_generate` باستخدام
Model نفسها `image-01`. وتستخدم إعدادات API key القيمة `MINIMAX_API_KEY`؛ أما إعدادات OAuth فيمكنها استخدام
مسار المصادقة المضمّن `minimax-portal` بدلًا من ذلك.

يستخدم إنشاء الصور دائمًا نقطة النهاية المخصصة للصور في MiniMax
‏(`/v1/image_generation`) ويتجاهل `models.providers.minimax.baseUrl`,
لأن هذا الحقل يهيّئ عنوان URL الأساسي للدردشة/المسار المتوافق مع Anthropic. اضبط
`MINIMAX_API_HOST=https://api.minimaxi.com` لتوجيه إنشاء الصور
عبر نقطة النهاية الخاصة بالصين؛ أما نقطة النهاية العالمية الافتراضية فهي
`https://api.minimax.io`.

عندما يقوم onboarding أو إعداد API key بكتابة إدخالات صريحة في `models.providers.minimax`,
يقوم OpenClaw بإنشاء `MiniMax-M2.7` و
`MiniMax-M2.7-highspeed` باعتبارهما Models دردشة نصية فقط. أما فهم الصور
فيُعرَض بشكل منفصل عبر provider الوسائط `MiniMax-VL-01` المملوكة للـ Plugin.

<Note>
راجع [إنشاء الصور](/ar/tools/image-generation) للاطلاع على معاملات الأداة المشتركة، واختيار provider، وسلوك failover.
</Note>

### تحويل النص إلى كلام

يسجّل Plugin المضمّن `minimax` نظام MiniMax T2A v2 بوصفه provider للكلام في
`messages.tts`.

- Model الافتراضية لـ TTS: `speech-2.8-hd`
- الصوت الافتراضي: `English_expressive_narrator`
- تشمل معرّفات Models المضمّنة المدعومة `speech-2.8-hd` و`speech-2.8-turbo`,
  و`speech-2.6-hd` و`speech-2.6-turbo` و`speech-02-hd`,
  و`speech-02-turbo` و`speech-01-hd` و`speech-01-turbo`.
- يكون حل المصادقة بالترتيب التالي: `messages.tts.providers.minimax.apiKey`، ثم
  ملفات تعريف المصادقة OAuth/token الخاصة بـ `minimax-portal`، ثم مفاتيح البيئة الخاصة بـ Token Plan ‏(`MINIMAX_OAUTH_TOKEN` و`MINIMAX_CODE_PLAN_KEY`,
  و`MINIMAX_CODING_API_KEY`)، ثم `MINIMAX_API_KEY`.
- إذا لم يتم تهيئة مضيف TTS، يعيد OpenClaw استخدام
  مضيف OAuth الخاص بـ `minimax-portal` المهيأ ويزيل لواحق المسار
  المتوافقة مع Anthropic مثل `/anthropic`.
- تظل المرفقات الصوتية العادية بصيغة MP3.
- تُحوَّل الأهداف الخاصة بالملاحظات الصوتية مثل Feishu وTelegram من صيغة MP3 في MiniMax
  إلى Opus بتردد 48kHz باستخدام `ffmpeg`، لأن واجهة Feishu/Lark للملفات لا
  تقبل إلا `file_type: "opus"` للرسائل الصوتية الأصلية.
- يقبل MiniMax T2A قيم `speed` و`vol` الكسرية، لكن `pitch` يُرسل كعدد
  صحيح؛ ويقوم OpenClaw باقتطاع قيم `pitch` الكسرية قبل طلب API.

| الإعداد                                  | متغير env              | الافتراضي                    | الوصف                             |
| ---------------------------------------- | ---------------------- | ---------------------------- | --------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`     | مضيف API الخاص بـ MiniMax T2A.    |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`              | معرّف Model الخاصة بـ TTS.         |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | معرّف الصوت المستخدم في خرج الكلام. |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                        | سرعة التشغيل، `0.5..2.0`.         |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                        | مستوى الصوت، `(0, 10]`.           |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                          | إزاحة pitch صحيحة، `-12..12`.     |

### إنشاء الموسيقى

يسجّل Plugin MiniMax المضمّن إنشاء الموسيقى عبر الأداة المشتركة
`music_generate` لكل من `minimax` و`minimax-portal`.

- Model الموسيقى الافتراضية: `minimax/music-2.6`
- Model الموسيقى لـ OAuth: `minimax-portal/music-2.6`
- يدعم أيضًا `minimax/music-2.5` و`minimax/music-2.0`
- عناصر التحكم في prompt: `lyrics` و`instrumental` و`durationSeconds`
- تنسيق الإخراج: `mp3`
- تنفصل التشغيلات المعتمدة على الجلسة عبر تدفق المهمة/الحالة المشترك، بما في ذلك `action: "status"`

لاستخدام MiniMax بوصفه provider الافتراضي للموسيقى:

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
راجع [إنشاء الموسيقى](/ar/tools/music-generation) للاطلاع على معاملات الأداة المشتركة، واختيار provider، وسلوك failover.
</Note>

### إنشاء الفيديو

يسجّل Plugin MiniMax المضمّن إنشاء الفيديو عبر الأداة المشتركة
`video_generate` لكل من `minimax` و`minimax-portal`.

- Model الفيديو الافتراضية: `minimax/MiniMax-Hailuo-2.3`
- Model الفيديو لـ OAuth: `minimax-portal/MiniMax-Hailuo-2.3`
- الأوضاع: نص إلى فيديو وتدفقات المراجع ذات الصورة الواحدة
- يدعم `aspectRatio` و`resolution`

لاستخدام MiniMax بوصفه provider الافتراضي للفيديو:

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
راجع [إنشاء الفيديو](/ar/tools/video-generation) للاطلاع على معاملات الأداة المشتركة، واختيار provider، وسلوك failover.
</Note>

### فهم الصور

يسجّل Plugin MiniMax فهم الصور بشكل منفصل عن
فهرس النص:

| معرّف Provider   | Model الصور الافتراضية |
| ---------------- | ---------------------- |
| `minimax`        | `MiniMax-VL-01`        |
| `minimax-portal` | `MiniMax-VL-01`        |

ولهذا السبب يمكن للتوجيه التلقائي للوسائط أن يستخدم فهم الصور في MiniMax حتى
عندما لا يزال فهرس provider النصي المضمّن يعرض مراجع دردشة M2.7 النصية فقط.

### البحث على الويب

يسجّل Plugin MiniMax أيضًا الأداة `web_search` عبر MiniMax Coding Plan
search API.

- معرّف provider: `minimax`
- النتائج المنظمة: عناوين، وURLs، ومقتطفات، واستعلامات ذات صلة
- متغير env المفضل: `MINIMAX_CODE_PLAN_KEY`
- الاسم المستعار المقبول في env: `MINIMAX_CODING_API_KEY`
- fallback للتوافق: `MINIMAX_API_KEY` عندما يشير أصلًا إلى coding-plan token
- إعادة استخدام المنطقة: `plugins.entries.minimax.config.webSearch.region`، ثم `MINIMAX_API_HOST`، ثم عناوين MiniMax provider الأساسية
- يبقى البحث على معرّف provider ‏`minimax`؛ ويمكن لإعداد OAuth الخاص بالصين/العالمي أن يوجّه المنطقة بصورة غير مباشرة عبر `models.providers.minimax-portal.baseUrl`

توجد الإعدادات تحت `plugins.entries.minimax.config.webSearch.*`.

<Note>
راجع [MiniMax Search](/ar/tools/minimax-search) لمعرفة إعدادات البحث على الويب والاستخدام الكامل.
</Note>

## إعدادات متقدمة

<AccordionGroup>
  <Accordion title="خيارات الإعدادات">
    | الخيار | الوصف |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | يفضَّل `https://api.minimax.io/anthropic` (متوافق مع Anthropic)؛ ويُعد `https://api.minimax.io/v1` اختياريًا للحمولات المتوافقة مع OpenAI |
    | `models.providers.minimax.api` | يُفضَّل `anthropic-messages`؛ ويُعد `openai-completions` اختياريًا للحمولات المتوافقة مع OpenAI |
    | `models.providers.minimax.apiKey` | API key الخاصة بـ MiniMax ‏(`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | عرّف `id` و`name` و`reasoning` و`contextWindow` و`maxTokens` و`cost` |
    | `agents.defaults.models` | أعطِ أسماء مستعارة للـ Models التي تريدها في allowlist |
    | `models.mode` | أبقِها `merge` إذا كنت تريد إضافة MiniMax إلى جانب المضمّنات |
  </Accordion>

  <Accordion title="الإعدادات الافتراضية للتفكير">
    على `api: "anthropic-messages"`، يحقن OpenClaw القيمة `thinking: { type: "disabled" }` ما لم يكن التفكير مضبوطًا أصلًا صراحةً في params/config.

    ويمنع هذا نقطة نهاية البث الخاصة بـ MiniMax من إصدار `reasoning_content` في أجزاء delta بنمط OpenAI، وهو ما قد يسرّب الاستدلال الداخلي إلى المخرجات المرئية.

  </Accordion>

  <Accordion title="الوضع السريع">
    يقوم `/fast on` أو `params.fastMode: true` بإعادة كتابة `MiniMax-M2.7` إلى `MiniMax-M2.7-highspeed` على مسار البث المتوافق مع Anthropic.
  </Accordion>

  <Accordion title="مثال على fallback">
    **الأفضل لـ:** إبقاء أقوى model لديك من أحدث جيل كـ primary، مع fail over إلى MiniMax M2.7. يستخدم المثال أدناه Opus كـ primary محدد؛ استبدله بـ model الأساسية المفضلة لديك من أحدث جيل.

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
    - واجهة برمجة تطبيقات استخدام Coding Plan: ‏`https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` ‏(تتطلب coding plan key).
    - يطبع OpenClaw استخدام MiniMax coding-plan بنفس عرض `% المتبقي` المستخدم لدى providers الآخرين. فحقولا MiniMax الخام `usage_percent` / `usagePercent` يمثلان الحصة المتبقية، لا الحصة المستهلكة، لذلك يعكسهما OpenClaw. وتفوز الحقول القائمة على العدّ عند وجودها.
    - عندما تُعيد API القيمة `model_remains`، يفضّل OpenClaw إدخال chat-model، ويشتق تسمية النافذة من `start_time` / `end_time` عند الحاجة، ويتضمن اسم model المحددة في تسمية الخطة بحيث يسهل تمييز نوافذ coding-plan.
    - تتعامل لقطات الاستخدام مع `minimax` و`minimax-cn` و`minimax-portal` على أنها سطح الحصة نفسه لـ MiniMax، وتفضّل OAuth المخزنة الخاصة بـ MiniMax قبل الرجوع إلى مفاتيح env الخاصة بـ Coding Plan.

  </Accordion>
</AccordionGroup>

## ملاحظات

- تتبع مراجع Models مسار المصادقة:
  - إعداد API key: ‏`minimax/<model>`
  - إعداد OAuth: ‏`minimax-portal/<model>`
- Model الدردشة الافتراضية: `MiniMax-M2.7`
- Model الدردشة البديلة: `MiniMax-M2.7-highspeed`
- يكتب onboarding وإعداد API key المباشر تعريفات Models نصية فقط لكلا متغيري M2.7
- يستخدم فهم الصور provider الوسائط `MiniMax-VL-01` المملوكة للـ Plugin
- حدّث قيم التسعير في `models.json` إذا كنت تحتاج إلى تتبع دقيق للتكلفة
- استخدم `openclaw models list` للتأكد من معرّف provider الحالي، ثم بدّل باستخدام `openclaw models set minimax/MiniMax-M2.7` أو `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
رابط إحالة لـ MiniMax Coding Plan ‏(خصم 10٪): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
راجع [Model providers](/ar/concepts/model-providers) للاطلاع على قواعد provider.
</Note>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M2.7"'>
    يعني هذا عادةً أن **provider الخاصة بـ MiniMax غير مهيأة** (لا يوجد إدخال provider مطابق ولا يوجد auth profile/env key خاص بـ MiniMax). يوجد إصلاح لهذا الاكتشاف في **2026.1.12**. ويمكن الإصلاح عبر:

    - الترقية إلى **2026.1.12** ‏(أو التشغيل من المصدر `main`)، ثم إعادة تشغيل gateway.
    - تشغيل `openclaw configure` واختيار أحد خيارات مصادقة **MiniMax**، أو
    - إضافة الكتلة المطابقة `models.providers.minimax` أو `models.providers.minimax-portal` يدويًا، أو
    - ضبط `MINIMAX_API_KEY` أو `MINIMAX_OAUTH_TOKEN` أو auth profile خاصة بـ MiniMax حتى يمكن حقن provider المطابقة.

    تأكد من أن معرّف model **حساس لحالة الأحرف**:

    - مسار API key: ‏`minimax/MiniMax-M2.7` أو `minimax/MiniMax-M2.7-highspeed`
    - مسار OAuth: ‏`minimax-portal/MiniMax-M2.7` أو `minimax-portal/MiniMax-M2.7-highspeed`

    ثم تحقّق مجددًا باستخدام:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
للمزيد من المساعدة: [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) و[الأسئلة الشائعة](/ar/help/faq).
</Note>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار Model" href="/ar/concepts/model-providers" icon="layers">
    اختيار providers، ومراجع Models، وسلوك failover.
  </Card>
  <Card title="إنشاء الصور" href="/ar/tools/image-generation" icon="image">
    معاملات أداة الصور المشتركة واختيار provider.
  </Card>
  <Card title="إنشاء الموسيقى" href="/ar/tools/music-generation" icon="music">
    معاملات أداة الموسيقى المشتركة واختيار provider.
  </Card>
  <Card title="إنشاء الفيديو" href="/ar/tools/video-generation" icon="video">
    معاملات أداة الفيديو المشتركة واختيار provider.
  </Card>
  <Card title="MiniMax Search" href="/ar/tools/minimax-search" icon="magnifying-glass">
    إعدادات البحث على الويب عبر MiniMax Coding Plan.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    استكشاف الأخطاء وإصلاحها بشكل عام والأسئلة الشائعة.
  </Card>
</CardGroup>
