---
read_when:
    - تريد استخدام توليد الصور من fal في OpenClaw
    - تحتاج إلى تدفق مصادقة FAL_KEY
    - تريد إعدادات fal الافتراضية لـ image_generate أو video_generate أو music_generate
summary: إعداد توليد الصور والفيديو والموسيقى عبر fal في OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-06-27T18:24:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af294939a39673fb32cb68c882708dbe69b64ca5e5d13f5504de9d1d8715e3bd
    source_path: providers/fal.md
    workflow: 16
---

يوفر OpenClaw موفر `fal` مضمنا لتوليد الصور والفيديو والموسيقى
المستضافة.

| الخاصية | القيمة                                                        |
| -------- | ------------------------------------------------------------- |
| الموفر | `fal`                                                         |
| المصادقة     | `FAL_KEY` (أساسي؛ يعمل `FAL_API_KEY` أيضا كاحتياطي) |
| API      | نقاط نهاية نماذج fal                                           |

## بدء الاستخدام

<Steps>
  <Step title="عيّن مفتاح API">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="عيّن نموذج صور افتراضيا">
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

يعتمد موفر توليد الصور `fal` المضمن افتراضيا على
`fal/fal-ai/flux/dev`.

| القدرة     | القيمة                                                              |
| -------------- | ------------------------------------------------------------------ |
| الحد الأقصى للصور     | 4 لكل طلب؛ Krea 2: صورة واحدة لكل طلب                               |
| وضع التحرير      | Flux: صورة مرجعية واحدة؛ GPT Image 2: 10؛ Nano Banana 2: 14        |
| مراجع الأسلوب     | Krea 2: ما يصل إلى 10 مراجع أسلوب عبر `image` / `images`           |
| تجاوزات الحجم | مدعومة                                                          |
| نسبة العرض إلى الارتفاع   | مدعومة للتوليد، وKrea 2، وتحرير GPT Image 2/Nano Banana 2 |
| الدقة     | مدعومة                                                          |
| تنسيق الإخراج  | `png` أو `jpeg`                                                    |

<Warning>
طلبات تحويل الصور إلى صور في Flux **لا** تدعم تجاوزات `aspectRatio`. تستخدم طلبات تحرير GPT
Image 2 وNano Banana 2 نقطة النهاية `/edit` في fal وتقبل
تلميحات نسبة العرض إلى الارتفاع. يقبل Nano Banana 2 أيضا نسبا عريضة/طويلة أصلية إضافية
مثل `4:1` و`1:4` و`8:1` و`1:8`؛ ويتحقق Krea 2 من مجموعته الفرعية الأصغر
لنسب العرض إلى الارتفاع.
</Warning>

تستخدم نماذج Krea 2 مخطط حمولة Krea الأصلي في fal. يرسل OpenClaw
`aspect_ratio` و`creativity` و`image_style_references` بدلا من حمولة
`image_size` العامة / نقطة نهاية التحرير التي يستخدمها Flux. مراجع النماذج هي:

- `fal/krea/v2/medium/text-to-image`
- `fal/krea/v2/large/text-to-image`

استخدم Medium للرسم التعبيري الأسرع، والأنمي، والتلوين، والأساليب الفنية.
واستخدم Large للحصول على مظهر فوتوغرافي واقعي أبطأ، وملمس خام، وحبيبات فيلم، وتفاصيل
أدق. القيمة الافتراضية في Krea هي `fal.creativity: "medium"`؛ والقيم المدعومة هي
`raw` و`low` و`medium` و`high`.

يعرض Krea 2 نسبة العرض إلى الارتفاع، لا `image_size`، في مخطط طلب fal. فضّل
`aspectRatio`؛ يطابق OpenClaw قيمة `size` مع أقرب نسبة عرض إلى ارتفاع مدعومة في Krea
ويرفض `resolution` مع Krea بدلا من إسقاطه.

استخدم `outputFormat: "png"` عندما تريد إخراج PNG من نماذج fal التي تعرض
`output_format`. لا يعلن fal عن تحكم صريح في الخلفية الشفافة
ضمن OpenClaw، لذلك يتم الإبلاغ عن `background: "transparent"` كتجاوز متجاهل
لنماذج fal.
لا تعرض نقاط نهاية Krea 2 حقل طلب `output_format` عبر fal، لذلك
يرفض OpenClaw تجاوزات `outputFormat` لطلبات Krea.

لاستخدام fal كموفر الصور الافتراضي:

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

يعتمد موفر توليد الفيديو `fal` المضمن افتراضيا على
`fal/fal-ai/minimax/video-01-live`.

| القدرة | القيمة                                                              |
| ---------- | ------------------------------------------------------------------ |
| الأوضاع      | نص إلى فيديو، مرجع صورة واحدة، Seedance مرجع إلى فيديو |
| وقت التشغيل    | تدفق إرسال/حالة/نتيجة مدعوم بطابور للمهام طويلة التشغيل       |

<AccordionGroup>
  <Accordion title="نماذج الفيديو المتاحة">
    **HeyGen video-agent:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/fast/reference-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`
    - `fal/bytedance/seedance-2.0/reference-to-video`

  </Accordion>

  <Accordion title="مثال إعداد Seedance 2.0">
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

  <Accordion title="مثال إعداد Seedance 2.0 للمرجع إلى الفيديو">
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

    يقبل المرجع إلى الفيديو ما يصل إلى 9 صور، و3 فيديوهات، و3 مراجع صوتية
    عبر معاملات `video_generate` المشتركة `images` و`videos` و`audioRefs`
    بإجمالي لا يتجاوز 12 ملفا مرجعيا.

  </Accordion>

  <Accordion title="مثال إعداد HeyGen video-agent">
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

يسجل Plugin `fal` المضمن أيضا موفر توليد موسيقى لأداة
`music_generate` المشتركة.

| القدرة    | القيمة                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| النموذج الافتراضي | `fal/fal-ai/minimax-music/v2.6`                                                                        |
| النماذج        | `fal-ai/minimax-music/v2.6`, `fal-ai/ace-step/prompt-to-audio`, `fal-ai/stable-audio-25/text-to-audio` |
| وقت التشغيل       | طلب متزامن بالإضافة إلى تنزيل الصوت المولد                                                      |

استخدم fal كموفر الموسيقى الافتراضي:

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

يدعم `fal-ai/minimax-music/v2.6` كلمات صريحة ووضعا آليا.
ACE-Step وStable Audio هما نقطتا نهاية لتحويل المطالبة إلى صوت؛ اخترهما باستخدام
تجاوز `model` عندما تريد عائلات النماذج هذه.

<Tip>
استخدم `openclaw models list --provider fal` للاطلاع على القائمة الكاملة لنماذج fal
المتاحة، بما في ذلك أي إدخالات أضيفت حديثا.
</Tip>

## ذات صلة

<CardGroup cols={2}>
  <Card title="توليد الصور" href="/ar/tools/image-generation" icon="image">
    معاملات أداة الصور المشتركة واختيار الموفر.
  </Card>
  <Card title="توليد الفيديو" href="/ar/tools/video-generation" icon="video">
    معاملات أداة الفيديو المشتركة واختيار الموفر.
  </Card>
  <Card title="توليد الموسيقى" href="/ar/tools/music-generation" icon="music">
    معاملات أداة الموسيقى المشتركة واختيار الموفر.
  </Card>
  <Card title="مرجع الإعدادات" href="/ar/gateway/config-agents#agent-defaults" icon="gear">
    الإعدادات الافتراضية للوكلاء بما في ذلك اختيار نماذج الصور والفيديو والموسيقى.
  </Card>
</CardGroup>
