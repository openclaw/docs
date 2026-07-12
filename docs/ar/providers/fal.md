---
read_when:
    - تريد استخدام توليد الصور عبر fal في OpenClaw
    - تحتاج إلى مسار مصادقة FAL_KEY
    - تريد إعدادات fal الافتراضية لـ image_generate أو video_generate أو music_generate
summary: إعداد fal لتوليد الصور والفيديو والموسيقى في OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-07-12T06:22:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9bd868aaf6771f6fa38bb8e2a83133460d150e2a5aa9e5b888e221c07f29e0ad
    source_path: providers/fal.md
    workflow: 16
---

يوفّر OpenClaw مزوّد `fal` مضمّنًا لتوليد الصور ومقاطع الفيديو والموسيقى
عبر خدمات مستضافة.

| الخاصية | القيمة                                                                          |
| -------- | ------------------------------------------------------------------------------- |
| المزوّد | `fal`                                                                           |
| المصادقة | `FAL_KEY` (المعتمد؛ يعمل `FAL_API_KEY` أيضًا كخيار احتياطي)                   |
| API      | نقاط نهاية نماذج fal‏ (`https://fal.run`؛ تستخدم مهام الفيديو `https://queue.fal.run`) |
| عنوان URL الأساسي | يمكن تجاوزه باستخدام `models.providers.fal.baseUrl`                                    |

## بدء الاستخدام

<Steps>
  <Step title="تعيين مفتاح API">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```

    يمكن لعمليات الإعداد غير التفاعلية تمرير `--fal-api-key <key>` أو تصدير `FAL_KEY`.
    كما تضبط عملية الإعداد الأولي `fal/fal-ai/flux/dev` بوصفه نموذج الصور الافتراضي عند
    عدم تكوين أي نموذج.

  </Step>
  <Step title="تعيين نموذج صور افتراضي">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "fal/fal-ai/flux/dev",
          },
        },
      },
    }
    ```
  </Step>
</Steps>

## توليد الصور

يستخدم مزوّد توليد الصور `fal` المضمّن
`fal/fal-ai/flux/dev` افتراضيًا.

| الإمكانية     | القيمة                                                              |
| -------------- | ------------------------------------------------------------------ |
| الحد الأقصى للصور | 4 لكل طلب؛ Krea 2: صورة واحدة لكل طلب                               |
| تجاوزات الحجم | `1024x1024`، `1024x1536`، `1536x1024`، `1024x1792`، `1792x1024`    |
| نسبة العرض إلى الارتفاع | مدعومة في كل موضع باستثناء تحويل صورة إلى صورة في Flux                    |
| الدقة     | `1K`، `2K`، `4K` (حدود كل نموذج أدناه)                          |
| تنسيق الإخراج  | `png` (الافتراضي) أو `jpeg`؛ يرفض Krea 2 تجاوزات `outputFormat` |

تُوجَّه طلبات التحرير (الصور المرجعية عبر معاملي `image` / `images` المشتركين)
إلى نقطة نهاية تحرير خاصة بكل نموذج، مع حدود مراجع خاصة بكل نموذج:

| عائلة النموذج              | مرجع النموذج بعد `fal/`                 | نقطة نهاية التحرير     | الحد الأقصى للصور المرجعية |
| ------------------------- | -------------------------------------- | ----------------- | -------------------- |
| Flux ونماذج fal الأخرى | `fal-ai/flux/dev` (الافتراضي)            | `/image-to-image` | 1                    |
| GPT Image                 | `openai/gpt-image-*`                   | `/edit`           | 10                   |
| Grok Imagine              | `xai/grok-imagine-image`               | `/edit`           | 3                    |
| Nano Banana (قديم)      | `fal-ai/nano-banana`                   | `/edit`           | 3                    |
| Nano Banana 2             | `fal-ai/nano-banana-*`                 | `/edit`           | 14                   |
| Nano Banana 2 Lite        | `google/nano-banana-2-lite`            | `/edit`           | 14                   |
| Krea 2                    | `krea/v2/{medium,large}/text-to-image` | لا توجد (مراجع أنماط) | 10 مراجع أنماط  |

<Warning>
لا تدعم طلبات تحويل صورة إلى صورة في Flux تجاوزات `aspectRatio`. تستخدم طلبات
تحرير GPT Image وNano Banana 2 نقطة النهاية `/edit` في fal، وتقبل تلميحات
نسبة العرض إلى الارتفاع. كما يقبل Nano Banana 2 نسبًا أصلية إضافية عريضة/طويلة
مثل `4:1` و`1:4` و`8:1` و`1:8`؛ ويتحقق Krea 2 من مجموعته الأصغر الخاصة
بنسب العرض إلى الارتفاع. لدى Grok Imagine قائمة نسب خاصة به (بما في ذلك `2:1`
و`20:9` و`19.5:9` ومقلوباتها)، ولا يقبل سوى دقتي `1K`/`2K`؛
ويرفض Nano Banana القديم وNano Banana 2 Lite تجاوزات `resolution`.
</Warning>

تستخدم نماذج Krea 2 مخطط حمولة Krea الأصلي في fal. يرسل OpenClaw
`aspect_ratio` و`creativity` و`image_style_references` بدلًا من
حمولة `image_size` / نقطة نهاية التحرير العامة التي يستخدمها Flux. مراجع النماذج هي:

- `fal/krea/v2/medium/text-to-image`
- `fal/krea/v2/large/text-to-image`

استخدم Medium للحصول على رسوم توضيحية تعبيرية وأنيمي ولوحات وأنماط فنية
بسرعة أكبر. واستخدم Large للحصول على واقعية ضوئية وملمس خام وحبيبات فيلم ومظاهر
مفصلة بوتيرة أبطأ. القيمة الافتراضية في Krea هي `fal.creativity: "medium"`؛ والقيم المدعومة هي
`raw` و`low` و`medium` و`high`.

يعرض Krea 2 نسبة العرض إلى الارتفاع، وليس `image_size`، في مخطط طلب fal. يُفضّل استخدام
`aspectRatio`؛ يطابق OpenClaw قيمة `size` بأقرب نسبة عرض إلى ارتفاع مدعومة في Krea،
ويرفض `resolution` مع Krea بدلًا من تجاهله.

استخدم `outputFormat: "png"` عندما تريد إخراج PNG من نماذج fal التي تعرض
`output_format`. لا يعلن fal عن عنصر تحكم صريح في الخلفية الشفافة
ضمن OpenClaw، لذلك يُبلّغ عن `background: "transparent"` بوصفه تجاوزًا متجاهلًا
لنماذج fal.
لا تعرض نقاط نهاية Krea 2 حقل الطلب `output_format` عبر fal، لذلك
يرفض OpenClaw تجاوزات `outputFormat` لطلبات Krea.

لاستخدام Krea 2 Medium:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "fal/krea/v2/medium/text-to-image",
      },
    },
  },
}
```

## توليد الفيديو

يستخدم مزوّد توليد الفيديو `fal` المضمّن
`fal/fal-ai/minimax/video-01-live` افتراضيًا.

| الإمكانية | القيمة                                                              |
| ---------- | ------------------------------------------------------------------ |
| الأوضاع      | تحويل النص إلى فيديو، ومرجع بصورة واحدة، وتحويل المراجع إلى فيديو عبر Seedance |
| وقت التشغيل    | مسار إرسال/حالة/نتيجة مدعوم بطابور للمهام طويلة التشغيل       |
| المهلة    | 20 دقيقة لكل مهمة افتراضيًا؛ يُستطلع وضعها كل 5 ثوانٍ       |

<AccordionGroup>
  <Accordion title="نماذج الفيديو المتاحة">
    **MiniMax (الافتراضي):**

    - `fal/fal-ai/minimax/video-01-live`

    **وكيل فيديو HeyGen:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Kling وWan:**

    - `fal/fal-ai/kling-video/v2.1/master/text-to-video`
    - `fal/fal-ai/wan/v2.2-a14b/text-to-video`
    - `fal/fal-ai/wan/v2.2-a14b/image-to-video`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/fast/reference-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`
    - `fal/bytedance/seedance-2.0/reference-to-video`

    لا ترسل طلبات MiniMax Live وHeyGen سوى الموجّه، بالإضافة إلى صورة مرجعية
    واحدة اختيارية؛ ولا تُمرَّر التجاوزات الأخرى. تقبل نماذج Seedance
    `aspectRatio` و`size` و`resolution` ومددًا من 4 إلى 15 ثانية،
    ومفتاح تبديل للصوت.

  </Accordion>

  <Accordion title="مثال على تكوين Seedance 2.0">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/text-to-video",
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="مثال على تكوين تحويل المراجع إلى فيديو في Seedance 2.0">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/reference-to-video",
          },
        },
      },
    }
    ```

    يقبل تحويل المراجع إلى فيديو ما يصل إلى 9 صور و3 مقاطع فيديو و3 مراجع صوتية
    عبر معاملات `images` و`videos` و`audioRefs` المشتركة في `video_generate`،
    بحد أقصى إجمالي قدره 12 ملفًا مرجعيًا. تتطلب المراجع الصوتية
    مرجع صورة أو فيديو واحدًا على الأقل في الطلب نفسه.

  </Accordion>

  <Accordion title="مثال على تكوين وكيل فيديو HeyGen">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/fal-ai/heygen/v2/video-agent",
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## توليد الموسيقى

يسجّل Plugin ‏`fal` المضمّن أيضًا مزوّدًا لتوليد الموسيقى لأداة
`music_generate` المشتركة.

| الإمكانية    | القيمة                                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| النموذج الافتراضي | `fal/fal-ai/minimax-music/v2.6`                                                                                          |
| النماذج        | `fal-ai/minimax-music/v2.6` ‏(mp3)، `fal-ai/ace-step/prompt-to-audio` ‏(wav)، `fal-ai/stable-audio-25/text-to-audio` ‏(wav) |
| المدة القصوى  | 240 ثانية                                                                                                              |
| وقت التشغيل       | طلب متزامن يتبعه تنزيل الصوت المُنشأ                                                                        |

استخدم fal بوصفه مزوّد الموسيقى الافتراضي:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "fal/fal-ai/minimax-music/v2.6",
      },
    },
  },
}
```

يدعم `fal-ai/minimax-music/v2.6` كلمات أغنية صريحة ووضع الموسيقى الآلية،
ولكن ليس كليهما في الطلب نفسه. تمثل ACE-Step وStable Audio نقطتي نهاية
لتحويل الموجّه إلى صوت؛ اخترهما باستخدام تجاوز `model` عندما تريد
عائلتي النماذج هاتين. يرفض ACE-Step كلمات الأغنية الصريحة؛ ويرفض Stable Audio
كلًا من كلمات الأغنية ووضع الموسيقى الآلية.

<Tip>
تغطي الجداول والأقسام القابلة للطي أعلاه عائلات النماذج التي يتعامل معها مزوّد fal
المضمّن بحالات خاصة. لا يزال من الممكن اختيار معرّفات نقاط نهاية صور fal الأخرى
بوصفها نموذج الصور؛ ويجري التعامل معها مثل Flux (حمولة `image_size` عامة،
وصورة مرجعية واحدة عبر `/image-to-image`).
</Tip>

## ذو صلة

<CardGroup cols={2}>
  <Card title="توليد الصور" href="/ar/tools/image-generation" icon="image">
    معاملات أداة الصور المشتركة واختيار المزوّد.
  </Card>
  <Card title="توليد الفيديو" href="/ar/tools/video-generation" icon="video">
    معاملات أداة الفيديو المشتركة واختيار المزوّد.
  </Card>
  <Card title="توليد الموسيقى" href="/ar/tools/music-generation" icon="music">
    معاملات أداة الموسيقى المشتركة واختيار المزوّد.
  </Card>
  <Card title="مرجع التكوين" href="/ar/gateway/config-agents#agent-defaults" icon="gear">
    الإعدادات الافتراضية للوكيل، بما في ذلك اختيار نماذج الصور والفيديو والموسيقى.
  </Card>
</CardGroup>
