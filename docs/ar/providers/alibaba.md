---
read_when:
    - تريد استخدام توليد الفيديو Wan من Alibaba في OpenClaw
    - تحتاج إلى إعداد مفتاح API لـ Model Studio أو DashScope لتوليد الفيديو
summary: توليد الفيديو Alibaba Model Studio Wan في OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-04-24T07:57:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5abfe9ab595f2a323d6113995bf3075aa92c7f329b934d048e7ece256d94899
    source_path: providers/alibaba.md
    workflow: 15
---

يشحن OpenClaw مزوّد توليد فيديو `alibaba` مجمّعًا لنماذج Wan على
Alibaba Model Studio / DashScope.

- المزوّد: `alibaba`
- المصادقة المفضلة: `MODELSTUDIO_API_KEY`
- المقبول أيضًا: `DASHSCOPE_API_KEY`، و`QWEN_API_KEY`
- API: توليد فيديو غير متزامن عبر DashScope / Model Studio

## البدء

<Steps>
  <Step title="اضبط مفتاح API">
    ```bash
    openclaw onboard --auth-choice qwen-standard-api-key
    ```
  </Step>
  <Step title="اضبط نموذج فيديو افتراضي">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "alibaba/wan2.6-t2v",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="تحقّق من توفر المزوّد">
    ```bash
    openclaw models list --provider alibaba
    ```
  </Step>
</Steps>

<Note>
أي من مفاتيح المصادقة المقبولة (`MODELSTUDIO_API_KEY`، أو `DASHSCOPE_API_KEY`، أو `QWEN_API_KEY`) سيعمل. ويقوم خيار onboarding ‏`qwen-standard-api-key` بتهيئة بيانات اعتماد DashScope المشتركة.
</Note>

## نماذج Wan المدمجة

يسجل مزود `alibaba` المجمّع حاليًا ما يلي:

| مرجع النموذج | الوضع |
| -------------------------- | ------------------------- |
| `alibaba/wan2.6-t2v` | نص إلى فيديو |
| `alibaba/wan2.6-i2v` | صورة إلى فيديو |
| `alibaba/wan2.6-r2v` | مرجع إلى فيديو |
| `alibaba/wan2.6-r2v-flash` | مرجع إلى فيديو (سريع) |
| `alibaba/wan2.7-r2v` | مرجع إلى فيديو |

## الحدود الحالية

| المعلمة | الحد |
| --------------------- | --------------------------------------------------------- |
| مقاطع الفيديو الناتجة | حتى **1** لكل طلب |
| الصور المدخلة | حتى **1** |
| مقاطع الفيديو المدخلة | حتى **4** |
| المدة | حتى **10 ثوانٍ** |
| عناصر التحكم المدعومة | `size`، و`aspectRatio`، و`resolution`، و`audio`، و`watermark` |
| صورة/فيديو مرجعي | عناوين URL بعيدة من نوع `http(s)` فقط |

<Warning>
يتطلب وضع الصورة/الفيديو المرجعي حاليًا **عناوين URL بعيدة من نوع http(s)**. ولا يتم دعم مسارات الملفات المحلية للمدخلات المرجعية.
</Warning>

## إعداد متقدم

<AccordionGroup>
  <Accordion title="العلاقة مع Qwen">
    يستخدم مزوّد `qwen` المجمّع أيضًا نقاط نهاية DashScope المستضافة لدى Alibaba من أجل
    توليد فيديو Wan. استخدم:

    - `qwen/...` عندما تريد سطح مزود Qwen القياسي
    - `alibaba/...` عندما تريد سطح فيديو Wan المباشر المملوك للمورّد

    راجع [وثائق مزود Qwen](/ar/providers/qwen) لمزيد من التفاصيل.

  </Accordion>

  <Accordion title="أولوية مفتاح المصادقة">
    يتحقق OpenClaw من مفاتيح المصادقة بهذا الترتيب:

    1. `MODELSTUDIO_API_KEY` (المفضل)
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    يقوم أي من هذه المفاتيح بالمصادقة على مزود `alibaba`.

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="توليد الفيديو" href="/ar/tools/video-generation" icon="video">
    معلمات أداة الفيديو المشتركة واختيار المزوّد.
  </Card>
  <Card title="Qwen" href="/ar/providers/qwen" icon="microchip">
    إعداد مزوّد Qwen وتكامل DashScope.
  </Card>
  <Card title="مرجع الإعداد" href="/ar/gateway/config-agents#agent-defaults" icon="gear">
    افتراضيات الوكيل وإعداد النموذج.
  </Card>
</CardGroup>
