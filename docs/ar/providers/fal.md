---
read_when:
    - أنت تريد استخدام توليد الصور عبر fal في OpenClaw
    - أنت بحاجة إلى تدفق المصادقة `FAL_KEY`
    - أنت تريد القيم الافتراضية لـ `image_generate` أو `video_generate` في fal
summary: إعداد توليد الصور والفيديو عبر fal في OpenClaw
title: fal
x-i18n:
    generated_at: "2026-04-11T02:47:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9bfe4f69124e922a79a516a1bd78f0c00f7a45f3c6f68b6d39e0d196fa01beb3
    source_path: providers/fal.md
    workflow: 15
---

# fal

يشحن OpenClaw موفّر `fal` مضمّنًا لتوليد الصور والفيديو المستضاف.

- الموفّر: `fal`
- المصادقة: `FAL_KEY` (الأساسي؛ كما يعمل `FAL_API_KEY` كخيار احتياطي)
- API: نقاط نهاية نماذج fal

## البدء السريع

1. عيّن مفتاح API:

```bash
openclaw onboard --auth-choice fal-api-key
```

2. عيّن نموذج صور افتراضيًا:

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

## توليد الصور

يستخدم موفّر توليد الصور المضمّن `fal` افتراضيًا
`fal/fal-ai/flux/dev`.

- التوليد: حتى 4 صور لكل طلب
- وضع التحرير: مفعّل، مع صورة مرجعية واحدة
- يدعم `size` و`aspectRatio` و`resolution`
- الملاحظة الحالية في التحرير: لا تدعم نقطة نهاية تحرير الصور في fal
  تجاوزات `aspectRatio`

لاستخدام fal كموفّر الصور الافتراضي:

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

يستخدم موفّر توليد الفيديو المضمّن `fal` افتراضيًا
`fal/fal-ai/minimax/video-01-live`.

- الأوضاع: تحويل النص إلى فيديو وتدفّقات مرجعية بصورة واحدة
- وقت التشغيل: تدفّق إرسال/حالة/نتيجة مدعوم بطابور للمهام طويلة التشغيل
- مرجع نموذج وكيل الفيديو HeyGen:
  - `fal/fal-ai/heygen/v2/video-agent`
- مراجع نموذج Seedance 2.0:
  - `fal/bytedance/seedance-2.0/fast/text-to-video`
  - `fal/bytedance/seedance-2.0/fast/image-to-video`
  - `fal/bytedance/seedance-2.0/text-to-video`
  - `fal/bytedance/seedance-2.0/image-to-video`

لاستخدام Seedance 2.0 كنموذج الفيديو الافتراضي:

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

لاستخدام وكيل الفيديو HeyGen كنموذج الفيديو الافتراضي:

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

## ذو صلة

- [توليد الصور](/ar/tools/image-generation)
- [توليد الفيديو](/ar/tools/video-generation)
- [مرجع الإعدادات](/ar/gateway/configuration-reference#agent-defaults)
