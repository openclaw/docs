---
read_when:
- تريد استخدام توليد الفيديو عبر Runway في OpenClaw
- تحتاج إلى إعداد مفتاح API/متغيرات env الخاصة بـ Runway
- You want to make Runway the default video provider
summary: إعداد توليد الفيديو عبر Runway في OpenClaw
title: Runway
x-i18n:
  generated_at: '2026-04-24T08:00:57Z'
  refreshed_at: '2026-04-28T04:45:00Z'
  model: gpt-5.4
  provider: openai
  source_hash: 9648ca4403283cd23bf899d697f35a6b63986e8860227628c0d5789fceee3ce8
  source_path: providers/runway.md
  workflow: 15
---

يشحن OpenClaw مزوّد `runway` مضمّنًا لتوليد الفيديو المستضاف.

| الخاصية    | القيمة                                                            |
| ----------- | ----------------------------------------------------------------- |
| معرّف المزوّد | `runway`                                                        |
| المصادقة    | `RUNWAYML_API_SECRET` ‏(الأساسي) أو `RUNWAY_API_KEY`             |
| API         | توليد الفيديو المعتمد على مهام Runway ‏(استطلاع `GET /v1/tasks/{id}`) |

## البدء

<Steps>
  <Step title="اضبط مفتاح API">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="اضبط Runway كمزوّد الفيديو الافتراضي">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="ولّد فيديو">
    اطلب من الوكيل توليد فيديو. وسيجري استخدام Runway تلقائيًا.
  </Step>
</Steps>

## الأوضاع المدعومة

| الوضع           | النموذج            | إدخال المرجع            |
| -------------- | ------------------ | ----------------------- |
| تحويل النص إلى فيديو  | `gen4.5` ‏(الافتراضي) | لا شيء                 |
| تحويل الصورة إلى فيديو | `gen4.5`          | صورة محلية أو بعيدة واحدة |
| تحويل الفيديو إلى فيديو | `gen4_aleph`     | فيديو محلي أو بعيد واحد |

<Note>
تُدعَم مراجع الصور والفيديو المحلية عبر data URIs. وتكشف التشغيلات النصية فقط
حاليًا عن نسب الأبعاد `16:9` و`9:16`.
</Note>

<Warning>
يتطلب تحويل الفيديو إلى فيديو حاليًا `runway/gen4_aleph` تحديدًا.
</Warning>

## التهيئة

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

## التهيئة المتقدمة

<AccordionGroup>
  <Accordion title="الأسماء المستعارة لمتغيرات البيئة">
    يتعرف OpenClaw على كل من `RUNWAYML_API_SECRET` ‏(الأساسي) و`RUNWAY_API_KEY`.
    ويمكن لأي من المتغيرين أن يصادق مزوّد Runway.
  </Accordion>

  <Accordion title="استطلاع المهمة">
    تستخدم Runway واجهة API معتمدة على المهام. وبعد إرسال طلب توليد، يقوم OpenClaw
    باستطلاع `GET /v1/tasks/{id}` حتى يصبح الفيديو جاهزًا. ولا حاجة إلى
    أي تهيئة إضافية لسلوك الاستطلاع.
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="توليد الفيديو" href="/ar/tools/video-generation" icon="video">
    معلمات الأداة المشتركة، واختيار المزوّد، والسلوك غير المتزامن.
  </Card>
  <Card title="مرجع التهيئة" href="/ar/gateway/config-agents#agent-defaults" icon="gear">
    إعدادات الوكيل الافتراضية بما في ذلك نموذج توليد الفيديو.
  </Card>
</CardGroup>
