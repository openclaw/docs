---
read_when:
    - تريد استخدام إنشاء الفيديو عبر Runway في OpenClaw
    - تحتاج إلى إعداد مفتاح Runway API ومتغيرات البيئة الخاصة به
    - تريد جعل Runway مزوّد الفيديو الافتراضي
summary: إعداد إنشاء الفيديو باستخدام Runway في OpenClaw
title: المدرج
x-i18n:
    generated_at: "2026-07-12T06:31:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7aa2a802323857bf7c839ebfab56853dc79d656a25bbc194a431959a48bbd64b
    source_path: providers/runway.md
    workflow: 16
---

يوفّر OpenClaw موفّر `runway` مضمّنًا لإنشاء مقاطع الفيديو المستضافة، وهو مفعّل افتراضيًا ومسجّل وفق عقد `videoGenerationProviders`.

| الخاصية        | القيمة                                                             |
| --------------- | ----------------------------------------------------------------- |
| معرّف الموفّر     | `runway`                                                          |
| Plugin          | مضمّن، `enabledByDefault: true`                                 |
| متغيرات بيئة المصادقة   | `RUNWAYML_API_SECRET` (الأساسي) أو `RUNWAY_API_KEY`             |
| علامة الإعداد الأولي | `--auth-choice runway-api-key`                                    |
| علامة CLI المباشرة | `--runway-api-key <key>`                                          |
| API             | إنشاء فيديو قائم على المهام في Runway (استقصاء `GET /v1/tasks/{id}`) |
| النموذج الافتراضي   | `runway/gen4.5`                                                   |

## بدء الاستخدام

<Steps>
  <Step title="تعيين مفتاح API">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="تعيين Runway موفّر الفيديو الافتراضي">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="إنشاء فيديو">
    اطلب من الوكيل إنشاء فيديو. سيُستخدم Runway تلقائيًا.
  </Step>
</Steps>

## الأوضاع والنماذج المدعومة

يتيح الموفّر سبعة نماذج من Runway موزّعة على ثلاثة أوضاع. يمكن لمعرّف النموذج نفسه دعم أكثر من وضع واحد (على سبيل المثال، يعمل `gen4.5` لكل من تحويل النص إلى فيديو وتحويل الصورة إلى فيديو).

| الوضع           | النماذج                                                                 | مُدخل المرجع         |
| -------------- | ---------------------------------------------------------------------- | ----------------------- |
| تحويل النص إلى فيديو  | `gen4.5` (الافتراضي)، `veo3.1`، `veo3.1_fast`، `veo3`                    | لا شيء                    |
| تحويل الصورة إلى فيديو | `gen4.5`، `gen4_turbo`، `gen3a_turbo`، `veo3.1`، `veo3.1_fast`، `veo3` | صورة محلية أو بعيدة واحدة |
| تحويل الفيديو إلى فيديو | `gen4_aleph`                                                           | فيديو محلي أو بعيد واحد |

تُدعم مراجع الصور ومقاطع الفيديو المحلية عبر عناوين URI للبيانات.

| نسب العرض إلى الارتفاع         | القيم المسموح بها                              |
| --------------------- | ------------------------------------------- |
| تحويل النص إلى فيديو         | `16:9`، `9:16`                              |
| تعديلات الصور ومقاطع الفيديو | `1:1`، `16:9`، `9:16`، `3:4`، `4:3`، `21:9` |

<Warning>
  يتطلب تحويل الفيديو إلى فيديو حاليًا `runway/gen4_aleph`. ترفض معرّفات نماذج Runway الأخرى مُدخلات مراجع الفيديو.
</Warning>

<Note>
  يؤدي اختيار معرّف نموذج Runway من العمود الخطأ إلى ظهور خطأ صريح قبل مغادرة طلب API لـ OpenClaw. يتحقق الموفّر من `model` بمقارنته بقائمة السماح الخاصة بالوضع (`TEXT_ONLY_MODELS`، و`IMAGE_MODELS`، و`VIDEO_MODELS`) في `extensions/runway/video-generation-provider.ts`.
</Note>

## الإعداد

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "runway/gen4.5",
      },
    },
  },
}
```

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="الأسماء البديلة لمتغيرات البيئة">
    يتعرّف OpenClaw على كل من `RUNWAYML_API_SECRET` (الأساسي) و`RUNWAY_API_KEY`.
    يتيح أي من المتغيرين مصادقة موفّر Runway.
  </Accordion>

  <Accordion title="استقصاء المهام">
    يستخدم Runway واجهة API قائمة على المهام. بعد إرسال طلب إنشاء، يستقصي OpenClaw
    المسار `GET /v1/tasks/{id}` حتى يصبح الفيديو جاهزًا. لا يلزم أي
    إعداد إضافي لسلوك الاستقصاء.
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="إنشاء الفيديو" href="/ar/tools/video-generation" icon="video">
    معلمات الأداة المشتركة، واختيار الموفّر، والسلوك غير المتزامن.
  </Card>
  <Card title="مرجع الإعداد" href="/ar/gateway/config-agents#agent-defaults" icon="gear">
    الإعدادات الافتراضية للوكيل، بما في ذلك نموذج إنشاء الفيديو.
  </Card>
</CardGroup>
