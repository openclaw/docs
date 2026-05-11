---
read_when:
    - تريد استخدام توليد الصور عبر fal في OpenClaw
    - تحتاج إلى تدفق مصادقة FAL_KEY
    - تريد إعدادات fal الافتراضية لـ image_generate أو video_generate
summary: إعداد توليد الصور والفيديو باستخدام fal في OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-05-11T20:38:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f074629e5274154b7a17686264a8b137d61df321d791d6e47c9d8abe67ad273
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw يوفّر مزوّد `fal` مضمّنًا لإنشاء الصور والفيديوهات المستضاف.

| الخاصية | القيمة                                                        |
| -------- | ------------------------------------------------------------- |
| المزوّد | `fal`                                                         |
| المصادقة | `FAL_KEY` (الأساسي؛ يعمل `FAL_API_KEY` أيضًا كبديل احتياطي) |
| API      | نقاط نهاية نماذج fal                                           |

## بدء الاستخدام

<Steps>
  <Step title="تعيين مفتاح API">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
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

## إنشاء الصور

يعتمد مزوّد إنشاء الصور `fal` المضمّن افتراضيًا على
`fal/fal-ai/flux/dev`.

| الإمكانية     | القيمة                                                       |
| -------------- | ----------------------------------------------------------- |
| الحد الأقصى للصور | 4 لكل طلب                                               |
| وضع التحرير      | Flux: صورة مرجعية واحدة؛ GPT Image 2: 10؛ Nano Banana 2: 14 |
| تجاوزات الحجم | مدعومة                                                   |
| نسبة العرض إلى الارتفاع | مدعومة للإنشاء وتحرير GPT Image 2/Nano Banana 2   |
| الدقة     | مدعومة                                                   |
| تنسيق الإخراج  | `png` أو `jpeg`                                             |

<Warning>
طلبات Flux من صورة إلى صورة لا تدعم تجاوزات `aspectRatio`. تستخدم طلبات تحرير GPT
Image 2 وNano Banana 2 نقطة نهاية `/edit` الخاصة بـ fal وتقبل تلميحات
نسبة العرض إلى الارتفاع.
</Warning>

استخدم `outputFormat: "png"` عندما تريد إخراج PNG. لا يعلن fal عن عنصر تحكم
صريح للخلفية الشفافة في OpenClaw، لذلك يتم الإبلاغ عن `background:
"transparent"` كتجاوز متجاهل لنماذج fal.

لاستخدام fal كمزوّد صور افتراضي:

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

## إنشاء الفيديو

يعتمد مزوّد إنشاء الفيديو `fal` المضمّن افتراضيًا على
`fal/fal-ai/minimax/video-01-live`.

| الإمكانية | القيمة                                                              |
| ---------- | ------------------------------------------------------------------ |
| الأوضاع      | نص إلى فيديو، مرجع صورة واحدة، مرجع Seedance إلى فيديو |
| وقت التشغيل    | تدفق إرسال/حالة/نتيجة مدعوم بقائمة انتظار للمهام طويلة التشغيل       |

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

  <Accordion title="مثال إعداد مرجع إلى فيديو في Seedance 2.0">
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

    يقبل المرجع إلى فيديو ما يصل إلى 9 صور، و3 فيديوهات، و3 مراجع صوتية
    عبر معاملات `video_generate` المشتركة `images` و`videos` و`audioRefs`،
    وبحد أقصى 12 ملفًا مرجعيًا إجمالًا.

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

<Tip>
استخدم `openclaw models list --provider fal` للاطلاع على القائمة الكاملة لنماذج fal
المتاحة، بما في ذلك أي إدخالات أُضيفت حديثًا.
</Tip>

## ذات صلة

<CardGroup cols={2}>
  <Card title="إنشاء الصور" href="/ar/tools/image-generation" icon="image">
    معاملات أداة الصور المشتركة واختيار المزوّد.
  </Card>
  <Card title="إنشاء الفيديو" href="/ar/tools/video-generation" icon="video">
    معاملات أداة الفيديو المشتركة واختيار المزوّد.
  </Card>
  <Card title="مرجع الإعدادات" href="/ar/gateway/config-agents#agent-defaults" icon="gear">
    افتراضيات الوكيل، بما في ذلك اختيار نماذج الصور والفيديو.
  </Card>
</CardGroup>
