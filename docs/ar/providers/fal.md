---
read_when:
    - تريد استخدام إنشاء الصور عبر fal في OpenClaw
    - تحتاج إلى تدفق المصادقة FAL_KEY
    - تريد إعدادات fal الافتراضية لـ image_generate أو video_generate
summary: إعداد إنشاء الصور والفيديو عبر fal في OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-04-26T11:38:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: e6789f0fa1140cf76f0206c7384a79ee8b96de4af9e1dfedc00e5a3382f742bb
    source_path: providers/fal.md
    workflow: 15
---

يأتي OpenClaw مع provider مضمّن باسم `fal` لإنشاء الصور والفيديو المستضاف.

| الخاصية | القيمة                                                        |
| ------- | ------------------------------------------------------------- |
| Provider | `fal`                                                         |
| المصادقة | `FAL_KEY` (القياسي؛ ويعمل `FAL_API_KEY` أيضًا كخيار fallback) |
| API     | نقاط نهاية models الخاصة بـ fal                              |

## البدء

<Steps>
  <Step title="اضبط API key">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="اضبط model افتراضيًا للصور">
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

يستخدم provider المضمّن `fal` لإنشاء الصور القيمة الافتراضية
`fal/fal-ai/flux/dev`.

| capability    | القيمة                     |
| ------------- | -------------------------- |
| الحد الأقصى للصور | 4 لكل طلب                 |
| وضع التحرير    | مفعّل، صورة مرجعية واحدة   |
| تجاوزات الحجم  | مدعومة                     |
| نسبة الأبعاد   | مدعومة                     |
| الدقة          | مدعومة                     |
| تنسيق الإخراج  | `png` أو `jpeg`            |

<Warning>
لا تدعم نقطة نهاية تحرير الصور في fal تجاوزات `aspectRatio`.
</Warning>

استخدم `outputFormat: "png"` عندما تريد إخراجًا بصيغة PNG. لا يعرّف fal
عنصر تحكم صريحًا للخلفية الشفافة في OpenClaw، لذا تُبلَّغ القيمة `background:
"transparent"` على أنها تجاوز تم تجاهله في models الخاصة بـ fal.

لاستخدام fal بوصفه provider الافتراضي للصور:

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

يستخدم provider المضمّن `fal` لإنشاء الفيديو القيمة الافتراضية
`fal/fal-ai/minimax/video-01-live`.

| capability | القيمة                                                              |
| ---------- | ------------------------------------------------------------------- |
| الأوضاع    | نص إلى فيديو، وصورة مرجعية واحدة، وreference-to-video في Seedance |
| runtime    | تدفق submit/status/result معتمد على قائمة انتظار للمهام طويلة التشغيل |

<AccordionGroup>
  <Accordion title="Models الفيديو المتاحة">
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

  <Accordion title="مثال إعداد Seedance 2.0 reference-to-video">
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

    يقبل reference-to-video حتى 9 صور و3 فيديوهات و3 مراجع صوتية
    عبر معاملات `images` و`videos` و`audioRefs` المشتركة في `video_generate`،
    بحد أقصى 12 ملفًا مرجعيًا إجمالًا.

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
استخدم `openclaw models list --provider fal` لرؤية القائمة الكاملة لـ models
المتاحة في fal، بما في ذلك أي إدخالات أضيفت مؤخرًا.
</Tip>

## ذو صلة

<CardGroup cols={2}>
  <Card title="إنشاء الصور" href="/ar/tools/image-generation" icon="image">
    معاملات أداة الصور المشتركة واختيار provider.
  </Card>
  <Card title="إنشاء الفيديو" href="/ar/tools/video-generation" icon="video">
    معاملات أداة الفيديو المشتركة واختيار provider.
  </Card>
  <Card title="مرجع الإعدادات" href="/ar/gateway/config-agents#agent-defaults" icon="gear">
    القيم الافتراضية للوكيل، بما في ذلك اختيار model للصور والفيديو.
  </Card>
</CardGroup>
