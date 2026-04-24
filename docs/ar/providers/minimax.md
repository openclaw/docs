---
read_when:
    - تريد استخدام نماذج MiniMax في OpenClaw
    - تحتاج إلى إرشادات إعداد MiniMax
summary: استخدم نماذج MiniMax في OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-24T07:59:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: f2729e9e9f866e66a6587d6c58f6116abae2fc09a1f50e5038e1c25bed0a82f2
    source_path: providers/minimax.md
    workflow: 15
---

يستخدم مزوّد MiniMax في OpenClaw افتراضيًا **MiniMax M2.7**.

كما توفّر MiniMax أيضًا:

- توليف كلام مضمّن عبر T2A v2
- فهمًا مضمّنًا للصور عبر `MiniMax-VL-01`
- توليدًا مضمّنًا للموسيقى عبر `music-2.5+`
- أداة `web_search` مضمّنة عبر واجهة MiniMax Coding Plan الخاصة بالبحث

تقسيم المزوّد:

| معرّف المزوّد    | المصادقة | القدرات                                                        |
| ---------------- | -------- | -------------------------------------------------------------- |
| `minimax`        | مفتاح API | النص، وتوليد الصور، وفهم الصور، والكلام، والبحث على الويب     |
| `minimax-portal` | OAuth    | النص، وتوليد الصور، وفهم الصور                                 |

## الكتالوج المضمّن

| النموذج                    | النوع             | الوصف                                      |
| ------------------------ | ---------------- | ------------------------------------------ |
| `MiniMax-M2.7`           | دردشة (استدلال)   | نموذج الاستدلال المستضاف الافتراضي         |
| `MiniMax-M2.7-highspeed` | دردشة (استدلال)   | طبقة استدلال M2.7 الأسرع                   |
| `MiniMax-VL-01`          | رؤية              | نموذج فهم الصور                            |
| `image-01`               | توليد صور         | تحويل النص إلى صورة وتحرير صورة إلى صورة   |
| `music-2.5+`             | توليد موسيقى      | نموذج الموسيقى الافتراضي                   |
| `music-2.5`              | توليد موسيقى      | طبقة توليد الموسيقى السابقة                |
| `music-2.0`              | توليد موسيقى      | طبقة توليد الموسيقى القديمة                |
| `MiniMax-Hailuo-2.3`     | توليد فيديو       | تدفقات تحويل النص إلى فيديو ومرجع الصور    |

## البدء

اختر طريقة المصادقة المفضلة لديك واتبع خطوات الإعداد.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **الأفضل لـ:** إعداد سريع مع MiniMax Coding Plan عبر OAuth، من دون الحاجة إلى مفتاح API.

    <Tabs>
      <Tab title="دولي">
        <Steps>
          <Step title="شغّل الإعداد الأولي">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            يقوم هذا بالمصادقة على `api.minimax.io`.
          </Step>
          <Step title="تحقق من أن النموذج متاح">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="الصين">
        <Steps>
          <Step title="شغّل الإعداد الأولي">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            يقوم هذا بالمصادقة على `api.minimaxi.com`.
          </Step>
          <Step title="تحقق من أن النموذج متاح">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    تستخدم إعدادات OAuth معرّف المزوّد `minimax-portal`. وتتبع مراجع النماذج الشكل `minimax-portal/MiniMax-M2.7`.
    </Note>

    <Tip>
    رابط إحالة لخطة MiniMax Coding Plan ‏(خصم 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="مفتاح API">
    **الأفضل لـ:** MiniMax المستضافة مع واجهة API متوافقة مع Anthropic.

    <Tabs>
      <Tab title="دولي">
        <Steps>
          <Step title="شغّل الإعداد الأولي">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            يقوم هذا بتهيئة `api.minimax.io` بوصفه عنوان URL الأساسي.
          </Step>
          <Step title="تحقق من أن النموذج متاح">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="الصين">
        <Steps>
          <Step title="شغّل الإعداد الأولي">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            يقوم هذا بتهيئة `api.minimaxi.com` بوصفه عنوان URL الأساسي.
          </Step>
          <Step title="تحقق من أن النموذج متاح">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### مثال على التهيئة

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
                input: ["text", "image"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7-highspeed",
                name: "MiniMax M2.7 Highspeed",
                reasoning: true,
                input: ["text", "image"],
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
    على مسار التدفق المتوافق مع Anthropic، يعطّل OpenClaw تفكير MiniMax افتراضيًا ما لم تضبط `thinking` بنفسك صراحةً. إذ تُخرج نقطة نهاية التدفق في MiniMax قيمة `reasoning_content` على شكل أجزاء delta بنمط OpenAI بدلًا من كتل التفكير الأصلية في Anthropic، مما قد يسرّب التفكير الداخلي إلى المخرجات المرئية إذا تُرك مفعّلًا ضمنيًا.
    </Warning>

    <Note>
    تستخدم إعدادات مفتاح API معرّف المزوّد `minimax`. وتتبع مراجع النماذج الشكل `minimax/MiniMax-M2.7`.
    </Note>

  </Tab>
</Tabs>

## التهيئة عبر `openclaw configure`

استخدم معالج التهيئة التفاعلي لضبط MiniMax من دون تحرير JSON:

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
    | `minimax-global-api` | مفتاح API دولي |
    | `minimax-cn-api` | مفتاح API للصين |

  </Step>
  <Step title="اختر نموذجك الافتراضي">
    اختر نموذجك الافتراضي عند ظهور الطلب.
  </Step>
</Steps>

## القدرات

### توليد الصور

تسجّل Plugin الخاصة بـ MiniMax النموذج `image-01` لأداة `image_generate`. وهي تدعم:

- **توليد الصور من النص** مع التحكم في نسبة الأبعاد
- **تحرير الصور من صورة إلى صورة** (مرجع الموضوع) مع التحكم في نسبة الأبعاد
- حتى **9 صور ناتجة** لكل طلب
- حتى **صورة مرجعية واحدة** لكل طلب تحرير
- نسب الأبعاد المدعومة: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

لاستخدام MiniMax في توليد الصور، اضبطها كمزوّد توليد الصور:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

تستخدم Plugin قيمة `MINIMAX_API_KEY` نفسها أو مصادقة OAuth نفسها الخاصة بالنماذج النصية. ولا حاجة إلى أي تهيئة إضافية إذا كانت MiniMax معدّة بالفعل.

يسجّل كل من `minimax` و`minimax-portal` الأداة `image_generate` باستخدام
النموذج `image-01` نفسه. وتستخدم إعدادات مفتاح API القيمة `MINIMAX_API_KEY`; كما يمكن لإعدادات OAuth استخدام
مسار المصادقة المضمّن `minimax-portal` بدلًا من ذلك.

عندما يكتب الإعداد الأولي أو إعداد مفتاح API إدخالات صريحة في `models.providers.minimax`,
فإن OpenClaw يحقق النموذجين `MiniMax-M2.7` و
`MiniMax-M2.7-highspeed` مع `input: ["text", "image"]`.

أما كتالوج النص المضمّن الداخلي الخاص بـ MiniMax نفسه فيبقى بيانات وصفية نصية فقط
إلى أن توجد تهيئة المزوّد الصريحة تلك. ويُكشف فهم الصور بشكل منفصل
عبر مزوّد الوسائط `MiniMax-VL-01` المملوك لـ Plugin.

<Note>
راجع [توليد الصور](/ar/tools/image-generation) لمعلمات الأداة المشتركة، واختيار المزوّد، وسلوك الرجوع الاحتياطي.
</Note>

### توليد الموسيقى

كما تسجّل Plugin المضمّنة `minimax` توليد الموسيقى عبر الأداة المشتركة
`music_generate`.

- نموذج الموسيقى الافتراضي: `minimax/music-2.5+`
- تدعم أيضًا `minimax/music-2.5` و`minimax/music-2.0`
- أدوات التحكم في prompt: ‏`lyrics`, و`instrumental`, و`durationSeconds`
- تنسيق الإخراج: `mp3`
- تفصل التشغيلات المدعومة بالجلسة نفسها عبر تدفق المهمة/الحالة المشترك، بما في ذلك `action: "status"`

لاستخدام MiniMax كمزوّد الموسيقى الافتراضي:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "minimax/music-2.5+",
      },
    },
  },
}
```

<Note>
راجع [توليد الموسيقى](/ar/tools/music-generation) لمعلمات الأداة المشتركة، واختيار المزوّد، وسلوك الرجوع الاحتياطي.
</Note>

### توليد الفيديو

كما تسجّل Plugin المضمّنة `minimax` توليد الفيديو عبر الأداة المشتركة
`video_generate`.

- نموذج الفيديو الافتراضي: `minimax/MiniMax-Hailuo-2.3`
- الأوضاع: تحويل النص إلى فيديو وتدفقات مرجع صورة واحدة
- تدعم `aspectRatio` و`resolution`

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
راجع [توليد الفيديو](/ar/tools/video-generation) لمعلمات الأداة المشتركة، واختيار المزوّد، وسلوك الرجوع الاحتياطي.
</Note>

### فهم الصور

تسجّل Plugin MiniMax فهم الصور بشكل منفصل عن
كتالوج النص:

| معرّف المزوّد    | نموذج الصور الافتراضي |
| ---------------- | --------------------- |
| `minimax`        | `MiniMax-VL-01`       |
| `minimax-portal` | `MiniMax-VL-01`       |

ولهذا السبب يمكن للتوجيه التلقائي للوسائط أن يستخدم فهم الصور الخاص بـ MiniMax حتى
عندما لا يزال كتالوج مزوّد النص المضمّن يعرض مراجع دردشة M2.7 النصية فقط.

### البحث على الويب

كما تسجّل Plugin الخاصة بـ MiniMax الأداة `web_search` عبر MiniMax Coding Plan
search API.

- معرّف المزوّد: `minimax`
- نتائج منظّمة: عناوين، وعناوين URL، ومقتطفات، واستعلامات ذات صلة
- متغير env المفضل: `MINIMAX_CODE_PLAN_KEY`
- الاسم المستعار المقبول لـ env: ‏`MINIMAX_CODING_API_KEY`
- رجوع احتياطي للتوافق: `MINIMAX_API_KEY` عندما يشير بالفعل إلى coding-plan token
- إعادة استخدام المنطقة: `plugins.entries.minimax.config.webSearch.region`, ثم `MINIMAX_API_HOST`, ثم عناوين base URL الخاصة بمزوّد MiniMax
- يبقى البحث على معرّف المزوّد `minimax`; ويمكن لإعداد OAuth الخاص بالصين/العالمي أن يوجه المنطقة بشكل غير مباشر عبر `models.providers.minimax-portal.baseUrl`

توجد التهيئة تحت `plugins.entries.minimax.config.webSearch.*`.

<Note>
راجع [بحث MiniMax](/ar/tools/minimax-search) لتهيئة البحث على الويب واستخدامه بشكل كامل.
</Note>

## التهيئة المتقدمة

<AccordionGroup>
  <Accordion title="خيارات التهيئة">
    | الخيار | الوصف |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | فضّل `https://api.minimax.io/anthropic` ‏(متوافق مع Anthropic)؛ بينما يُعد `https://api.minimax.io/v1` اختياريًا للحمولات المتوافقة مع OpenAI |
    | `models.providers.minimax.api` | فضّل `anthropic-messages`; بينما يُعد `openai-completions` اختياريًا للحمولات المتوافقة مع OpenAI |
    | `models.providers.minimax.apiKey` | مفتاح API الخاص بـ MiniMax ‏(`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | عرّف `id`, و`name`, و`reasoning`, و`contextWindow`, و`maxTokens`, و`cost` |
    | `agents.defaults.models` | أضف أسماء مستعارة للنماذج التي تريدها في قائمة السماح |
    | `models.mode` | أبقِ القيمة `merge` إذا كنت تريد إضافة MiniMax إلى جانب المزوّدات المضمّنة |
  </Accordion>

  <Accordion title="الإعدادات الافتراضية للتفكير">
    على `api: "anthropic-messages"`, يحقن OpenClaw القيمة `thinking: { type: "disabled" }` ما لم يكن التفكير مضبوطًا صراحةً بالفعل في params/config.

    وهذا يمنع نقطة نهاية التدفق في MiniMax من إصدار `reasoning_content` على شكل أجزاء delta بنمط OpenAI, وهو ما قد يسرّب التفكير الداخلي إلى المخرجات المرئية.

  </Accordion>

  <Accordion title="الوضع السريع">
    يؤدي `/fast on` أو `params.fastMode: true` إلى إعادة كتابة `MiniMax-M2.7` إلى `MiniMax-M2.7-highspeed` على مسار التدفق المتوافق مع Anthropic.
  </Accordion>

  <Accordion title="مثال على الرجوع الاحتياطي">
    **الأفضل لـ:** إبقاء أقوى نموذج حديث لديك كنموذج أساسي، مع الرجوع الاحتياطي إلى MiniMax M2.7. يستخدم المثال أدناه Opus كنموذج أساسي محدد؛ استبدله بنموذجك الأساسي الحديث المفضل.

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
    - واجهة API لاستخدام Coding Plan: ‏`https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` ‏(تتطلب coding plan key).
    - يطبّع OpenClaw استخدام coding-plan الخاص بـ MiniMax إلى العرض نفسه `% left` المستخدم لدى المزوّدين الآخرين. فحقول `usage_percent` / `usagePercent` الخام في MiniMax تمثل الحصة المتبقية، وليس الحصة المستهلكة، لذلك يقوم OpenClaw بعكسها. وتفوز الحقول المعتمدة على العدد عند وجودها.
    - عندما تعيد واجهة API القيمة `model_remains`, يفضّل OpenClaw إدخال نموذج الدردشة، ويشتق تسمية النافذة من `start_time` / `end_time` عند الحاجة، ويضمّن اسم النموذج المحدد في تسمية الخطة بحيث يسهل التمييز بين نوافذ coding-plan.
    - تتعامل لقطات الاستخدام مع `minimax`, و`minimax-cn`, و`minimax-portal` على أنها سطح الحصة نفسه الخاص بـ MiniMax, وتفضّل OAuth المخزنة الخاصة بـ MiniMax قبل الرجوع إلى متغيرات env الخاصة بمفتاح Coding Plan.
  </Accordion>
</AccordionGroup>

## ملاحظات

- تتبع مراجع النماذج مسار المصادقة:
  - إعداد مفتاح API: ‏`minimax/<model>`
  - إعداد OAuth: ‏`minimax-portal/<model>`
- نموذج الدردشة الافتراضي: `MiniMax-M2.7`
- نموذج الدردشة البديل: `MiniMax-M2.7-highspeed`
- يكتب الإعداد الأولي وإعداد مفتاح API المباشر تعريفات نماذج صريحة مع `input: ["text", "image"]` لكلا متغيري M2.7
- يكشف كتالوج المزوّد المضمّن حاليًا مراجع الدردشة باعتبارها بيانات وصفية نصية فقط حتى توجد تهيئة صريحة لمزوّد MiniMax
- حدّث قيم الأسعار في `models.json` إذا كنت تحتاج إلى تتبع دقيق للتكلفة
- استخدم `openclaw models list` لتأكيد معرّف المزوّد الحالي، ثم بدّل باستخدام `openclaw models set minimax/MiniMax-M2.7` أو `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
رابط إحالة لخطة MiniMax Coding Plan ‏(خصم 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
راجع [مزوّدي النماذج](/ar/concepts/model-providers) لمعرفة قواعد المزوّدين.
</Note>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title='"نموذج غير معروف: minimax/MiniMax-M2.7"'>
    يعني هذا عادةً أن **مزوّد MiniMax غير مهيأ** ‏(لا يوجد إدخال مزوّد مطابق ولا ملف تعريف مصادقة/env key خاص بـ MiniMax). يوجد إصلاح لهذا الاكتشاف في **2026.1.12**. أصلح ذلك عبر:

    - الترقية إلى **2026.1.12** ‏(أو التشغيل من المصدر `main`), ثم إعادة تشغيل gateway.
    - تشغيل `openclaw configure` واختيار أحد خيارات مصادقة **MiniMax**, أو
    - إضافة كتلة `models.providers.minimax` أو `models.providers.minimax-portal` المطابقة يدويًا، أو
    - ضبط `MINIMAX_API_KEY`, أو `MINIMAX_OAUTH_TOKEN`, أو ملف تعريف مصادقة MiniMax حتى يمكن حقن المزوّد المطابق.

    تأكد من أن معرّف النموذج **حساس لحالة الأحرف**:

    - مسار مفتاح API: ‏`minimax/MiniMax-M2.7` أو `minimax/MiniMax-M2.7-highspeed`
    - مسار OAuth: ‏`minimax-portal/MiniMax-M2.7` أو `minimax-portal/MiniMax-M2.7-highspeed`

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
    اختيار المزوّدين، ومراجع النماذج، وسلوك الرجوع الاحتياطي.
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
    تهيئة البحث على الويب عبر MiniMax Coding Plan.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    استكشاف الأخطاء وإصلاحها بشكل عام والأسئلة الشائعة.
  </Card>
</CardGroup>
