---
read_when:
    - تريد مفتاح API واحدًا للعديد من نماذج اللغة الكبيرة
    - تحتاج إلى إرشادات إعداد Baidu Qianfan
summary: استخدم واجهة برمجة التطبيقات الموحّدة من Qianfan للوصول إلى العديد من النماذج في OpenClaw
title: تشيانفان
x-i18n:
    generated_at: "2026-07-12T06:30:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31387a53ee4472e2d20ae939ea75cea0d6f6367501becd56a8654fd97fdf0804
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan هي منصة MaaS من Baidu: واجهة API موحّدة ومتوافقة مع OpenAI توجّه الطلبات إلى نماذج متعددة خلف نقطة نهاية واحدة ومفتاح API واحد. يوفّرها OpenClaw بوصفها Plugin خارجيًا رسميًا باسم `@openclaw/qianfan-provider`.

| الخاصية       | القيمة                                   |
| ------------- | ---------------------------------------- |
| المزوّد       | `qianfan`                                |
| المصادقة      | `QIANFAN_API_KEY`                        |
| API           | متوافقة مع OpenAI (`openai-completions`) |
| عنوان URL الأساسي | `https://qianfan.baidubce.com/v2`    |
| النموذج الافتراضي | `qianfan/deepseek-v3.2`               |

## تثبيت Plugin

ثبّت Plugin الرسمي، ثم أعد تشغيل Gateway:

```bash
openclaw plugins install @openclaw/qianfan-provider
openclaw gateway restart
```

## بدء الاستخدام

<Steps>
  <Step title="إنشاء حساب Baidu Cloud">
    سجّل أو ادخل إلى حسابك في [وحدة تحكم Qianfan](https://console.bce.baidu.com/qianfan/ais/console/apiKey)، وتأكد من تمكين الوصول إلى API الخاصة بـ Qianfan.
  </Step>
  <Step title="إنشاء مفتاح API">
    أنشئ تطبيقًا جديدًا أو حدّد تطبيقًا موجودًا، ثم أنشئ مفتاح API. تستخدم مفاتيح Baidu Cloud التنسيق `bce-v3/ALTAK-...`.
  </Step>
  <Step title="تشغيل الإعداد الأولي">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```

    تقرأ عمليات التشغيل غير التفاعلية المفتاح من `--qianfan-api-key <key>` أو
    `QIANFAN_API_KEY`. يكتب الإعداد الأولي إعدادات المزوّد، ويضيف الاسم المستعار
    `QIANFAN` للنموذج الافتراضي، ويعيّن `qianfan/deepseek-v3.2`
    نموذجًا افتراضيًا عند عدم إعداد أي نموذج.

  </Step>
  <Step title="التحقق من توفر النموذج">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## الكتالوج المضمّن

| مرجع النموذج                        | الإدخال     | السياق  | الحد الأقصى للإخراج | الاستدلال | ملاحظات          |
| ----------------------------------- | ----------- | ------- | ------------------ | ---------- | ---------------- |
| `qianfan/deepseek-v3.2`             | نص          | 98,304  | 32,768             | نعم        | النموذج الافتراضي |
| `qianfan/ernie-5.0-thinking-preview` | نص، صورة   | 119,000 | 64,000             | نعم        | متعدد الوسائط     |

الكتالوج ثابت؛ ولا توجد آلية مباشرة لاكتشاف النماذج.

<Tip>
لا تحتاج إلى تجاوز `models.providers.qianfan` إلا عند الحاجة إلى عنوان URL أساسي مخصّص أو بيانات تعريف مخصّصة للنموذج.
</Tip>

## مثال على الإعدادات

```json5
{
  env: { QIANFAN_API_KEY: "bce-v3/ALTAK-..." },
  agents: {
    defaults: {
      model: { primary: "qianfan/deepseek-v3.2" },
      models: {
        "qianfan/deepseek-v3.2": { alias: "QIANFAN" },
      },
    },
  },
  models: {
    providers: {
      qianfan: {
        baseUrl: "https://qianfan.baidubce.com/v2",
        api: "openai-completions",
        models: [
          {
            id: "deepseek-v3.2",
            name: "DEEPSEEK V3.2",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 98304,
            maxTokens: 32768,
          },
          {
            id: "ernie-5.0-thinking-preview",
            name: "ERNIE-5.0-Thinking-Preview",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 119000,
            maxTokens: 64000,
          },
        ],
      },
    },
  },
}
```

<Note>
تستخدم مراجع النماذج البادئة `qianfan/` (مثل `qianfan/deepseek-v3.2`).
</Note>

<AccordionGroup>
  <Accordion title="النقل والتوافق">
    تعمل Qianfan عبر مسار النقل المتوافق مع OpenAI، وليس عبر تشكيل طلبات OpenAI الأصلي. تعمل ميزات OpenAI SDK القياسية، لكن قد لا تُمرَّر المعلمات الخاصة بالمزوّد.
  </Accordion>

  <Accordion title="استكشاف الأخطاء وإصلاحها">
    - تأكد من أن مفتاح API يبدأ بـ `bce-v3/ALTAK-` وأن الوصول إلى API الخاصة بـ Qianfan مُمكّن في وحدة تحكم Baidu Cloud.
    - إذا لم تظهر النماذج في القائمة، فتأكد من تفعيل خدمة Qianfan في حسابك.
    - لا تغيّر عنوان URL الأساسي إلا إذا كنت تستخدم نقطة نهاية مخصّصة أو خادمًا وسيطًا.

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="مرجع الإعدادات" href="/ar/gateway/configuration-reference" icon="gear">
    المرجع الكامل لإعدادات OpenClaw.
  </Card>
  <Card title="إعداد الوكيل" href="/ar/concepts/agent" icon="robot">
    إعداد القيم الافتراضية للوكيل وتعيينات النماذج.
  </Card>
  <Card title="وثائق API الخاصة بـ Qianfan" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    الوثائق الرسمية لـ API الخاصة بـ Qianfan.
  </Card>
</CardGroup>
