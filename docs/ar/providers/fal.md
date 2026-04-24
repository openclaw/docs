---
read_when:
    - تريد استخدام توليد الصور من fal في OpenClaw
    - تحتاج إلى تدفق مصادقة `FAL_KEY`
    - تريد إعدادات fal الافتراضية لـ `image_generate` أو `video_generate`
summary: إعداد fal لتوليد الصور والفيديو في OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-04-24T07:58:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: d23d2d0d27e5f60f9dacb4a6a7e4c07248cf45ccd80bfabaf6bb99f5f78946b2
    source_path: providers/fal.md
    workflow: 15
---

يشحن OpenClaw موفّر `fal` مضمّنًا لتوليد الصور والفيديو المستضاف.

| الخاصية | القيمة                                                        |
| -------- | ------------------------------------------------------------- |
| الموفّر | `fal`                                                         |
| المصادقة | `FAL_KEY` (القياسي؛ يعمل `FAL_API_KEY` أيضًا كخيار احتياطي) |
| API      | نقاط نهاية نماذج fal                                          |

## البدء

<Steps>
  <Step title="اضبط مفتاح API">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="اضبط نموذج الصور الافتراضي">
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

يستخدم موفّر توليد الصور `fal` المضمّن افتراضيًا
`fal/fal-ai/flux/dev`.

| الإمكانية      | القيمة                    |
| -------------- | ------------------------- |
| الحد الأقصى للصور | 4 لكل طلب                 |
| وضع التحرير     | مفعّل، صورة مرجعية واحدة  |
| تجاوزات الحجم   | مدعومة                    |
| نسبة الأبعاد    | مدعومة                    |
| الدقة           | مدعومة                    |

<Warning>
نقطة نهاية تحرير الصور في fal **لا** تدعم تجاوزات `aspectRatio`.
</Warning>

لاستخدام fal بوصفه موفّر الصور الافتراضي:

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

## توليد الفيديو

يستخدم موفّر توليد الفيديو `fal` المضمّن افتراضيًا
`fal/fal-ai/minimax/video-01-live`.

| الإمكانية | القيمة                                                        |
| ---------- | ------------------------------------------------------------ |
| الأوضاع    | نص إلى فيديو، وصورة مرجعية واحدة                             |
| بيئة التشغيل | تدفق إرسال/حالة/نتيجة مدعوم بالطوابير للمهام طويلة التشغيل |

<AccordionGroup>
  <Accordion title="نماذج الفيديو المتاحة">
    **HeyGen video-agent:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`

  </Accordion>

  <Accordion title="مثال على تهيئة Seedance 2.0">
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

  <Accordion title="مثال على تهيئة HeyGen video-agent">
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
استخدم `openclaw models list --provider fal` لرؤية القائمة الكاملة
لنماذج fal المتاحة، بما في ذلك أي إدخالات أُضيفت مؤخرًا.
</Tip>

## ذو صلة

<CardGroup cols={2}>
  <Card title="توليد الصور" href="/ar/tools/image-generation" icon="image">
    معلمات أداة الصور المشتركة واختيار الموفّر.
  </Card>
  <Card title="توليد الفيديو" href="/ar/tools/video-generation" icon="video">
    معلمات أداة الفيديو المشتركة واختيار الموفّر.
  </Card>
  <Card title="مرجع التهيئة" href="/ar/gateway/config-agents#agent-defaults" icon="gear">
    الإعدادات الافتراضية للوكيل، بما في ذلك اختيار نموذج الصور والفيديو.
  </Card>
</CardGroup>
