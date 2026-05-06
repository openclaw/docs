---
read_when:
    - تريد استخدام توليد الفيديو عبر Runway في OpenClaw
    - تحتاج إلى إعداد مفتاح API ومتغيرات البيئة لـ Runway
    - تريد جعل Runway موفّر الفيديو الافتراضي
summary: إعداد توليد الفيديو باستخدام Runway في OpenClaw
title: مدرج
x-i18n:
    generated_at: "2026-05-06T08:11:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51980217868c6d2f168f897106f81ea38dfcfde5265b14e394d4e232324a46b7
    source_path: providers/runway.md
    workflow: 16
---

يأتي OpenClaw مع مزوّد `runway` مضمّن لإنشاء الفيديو المستضاف. يكون Plugin ممكّنًا افتراضيًا ويسجّل مزوّد `runway` مقابل عقد `videoGenerationProviders`.

| الخاصية        | القيمة                                                             |
| --------------- | ----------------------------------------------------------------- |
| معرّف المزوّد     | `runway`                                                          |
| Plugin          | مضمّن، `enabledByDefault: true`                                 |
| متغيرات بيئة المصادقة   | `RUNWAYML_API_SECRET` (الأساسي) أو `RUNWAY_API_KEY`             |
| علم الإعداد الأولي | `--auth-choice runway-api-key`                                    |
| علم CLI المباشر | `--runway-api-key <key>`                                          |
| API             | إنشاء الفيديو القائم على مهام Runway (استطلاع `GET /v1/tasks/{id}`) |
| النموذج الافتراضي   | `runway/gen4.5`                                                   |

## البدء

<Steps>
  <Step title="اضبط مفتاح API">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="عيّن Runway كمزوّد الفيديو الافتراضي">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="أنشئ فيديو">
    اطلب من الوكيل إنشاء فيديو. سيُستخدم Runway تلقائيًا.
  </Step>
</Steps>

## الأوضاع والنماذج المدعومة

يوفّر المزوّد سبعة نماذج من Runway موزّعة على ثلاثة أوضاع. يمكن لمعرّف النموذج نفسه أن يخدم أكثر من وضع واحد (على سبيل المثال يعمل `gen4.5` لكل من تحويل النص إلى فيديو وتحويل الصورة إلى فيديو).

| الوضع           | النماذج                                                                 | إدخال مرجعي         |
| -------------- | ---------------------------------------------------------------------- | ----------------------- |
| تحويل النص إلى فيديو  | `gen4.5` (الافتراضي)، `veo3.1`، `veo3.1_fast`، `veo3`                    | لا يوجد                    |
| تحويل الصورة إلى فيديو | `gen4.5`، `gen4_turbo`، `gen3a_turbo`، `veo3.1`، `veo3.1_fast`، `veo3` | صورة محلية أو بعيدة واحدة |
| تحويل الفيديو إلى فيديو | `gen4_aleph`                                                           | فيديو محلي أو بعيد واحد |

تُدعم مراجع الصور والفيديو المحلية عبر عناوين URI للبيانات.

| نسب العرض إلى الارتفاع         | القيم المسموح بها                              |
| --------------------- | ------------------------------------------- |
| تحويل النص إلى فيديو         | `16:9`، `9:16`                              |
| تعديلات الصور والفيديو | `1:1`، `16:9`، `9:16`، `3:4`، `4:3`، `21:9` |

<Warning>
  يتطلب تحويل الفيديو إلى فيديو حاليًا `runway/gen4_aleph`. ترفض معرّفات نماذج Runway الأخرى إدخالات مراجع الفيديو.
</Warning>

<Note>
  يؤدي اختيار معرّف نموذج Runway من العمود الخطأ إلى ظهور خطأ صريح قبل أن يغادر طلب API من OpenClaw. يتحقق المزوّد من `model` مقابل قائمة السماح الخاصة بالوضع (`TEXT_ONLY_MODELS`، `IMAGE_MODELS`، `VIDEO_MODELS`) في `extensions/runway/video-generation-provider.ts`.
</Note>

## الإعدادات

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

## الإعدادات المتقدمة

<AccordionGroup>
  <Accordion title="الأسماء البديلة لمتغيرات البيئة">
    يتعرف OpenClaw على كل من `RUNWAYML_API_SECRET` (الأساسي) و`RUNWAY_API_KEY`.
    سيصادق أي من المتغيرين مزوّد Runway.
  </Accordion>

  <Accordion title="استطلاع المهام">
    يستخدم Runway واجهة API قائمة على المهام. بعد إرسال طلب إنشاء، يستطلع OpenClaw
    `GET /v1/tasks/{id}` إلى أن يصبح الفيديو جاهزًا. لا يلزم أي
    إعداد إضافي لسلوك الاستطلاع.
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="إنشاء الفيديو" href="/ar/tools/video-generation" icon="video">
    معلمات الأداة المشتركة، واختيار المزوّد، والسلوك غير المتزامن.
  </Card>
  <Card title="مرجع الإعدادات" href="/ar/gateway/config-agents#agent-defaults" icon="gear">
    إعدادات الوكيل الافتراضية، بما في ذلك نموذج إنشاء الفيديو.
  </Card>
</CardGroup>
