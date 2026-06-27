---
read_when:
    - تريد مفتاح API واحدًا للعديد من نماذج LLM
    - تحتاج إلى إرشادات إعداد Baidu Qianfan
summary: استخدم واجهة API الموحدة من Qianfan للوصول إلى العديد من النماذج في OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-06-27T18:27:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8bc31970dc7fbc43819ec6d51f4bd0047b1acc5a03b23b656e617e3abd97475
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan هي منصة MaaS من Baidu، وتوفر **API موحدًا** يوجّه الطلبات إلى نماذج عديدة خلف نقطة نهاية واحدة
ومفتاح API واحد. وهي متوافقة مع OpenAI، لذلك تعمل معظم OpenAI SDKs عند تبديل عنوان URL الأساسي.

| الخاصية | القيمة                            |
| -------- | --------------------------------- |
| المزوّد | `qianfan`                         |
| المصادقة | `QIANFAN_API_KEY`                 |
| API      | متوافق مع OpenAI                 |
| عنوان URL الأساسي | `https://qianfan.baidubce.com/v2` |

## تثبيت Plugin

ثبّت Plugin الرسمي، ثم أعد تشغيل Gateway:

```bash
openclaw plugins install @openclaw/qianfan-provider
openclaw gateway restart
```

## البدء

<Steps>
  <Step title="إنشاء حساب Baidu Cloud">
    سجّل أو ادخل في [وحدة تحكم Qianfan](https://console.bce.baidu.com/qianfan/ais/console/apiKey) وتأكد من تفعيل وصول Qianfan API لديك.
  </Step>
  <Step title="إنشاء مفتاح API">
    أنشئ تطبيقًا جديدًا أو اختر تطبيقًا موجودًا، ثم أنشئ مفتاح API. تنسيق المفتاح هو `bce-v3/ALTAK-...`.
  </Step>
  <Step title="تشغيل الإعداد الأولي">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```
  </Step>
  <Step title="التحقق من توفر النموذج">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## الكتالوج المدمج

| مرجع النموذج                         | الإدخال      | السياق | الحد الأقصى للإخراج | الاستدلال | ملاحظات       |
| ------------------------------------ | ----------- | ------- | ---------- | --------- | ------------- |
| `qianfan/deepseek-v3.2`              | نص          | 98,304  | 32,768     | نعم       | النموذج الافتراضي |
| `qianfan/ernie-5.0-thinking-preview` | نص، صورة | 119,000 | 64,000     | نعم       | متعدد الوسائط |

<Tip>
مرجع النموذج الافتراضي هو `qianfan/deepseek-v3.2`. لا تحتاج إلى تجاوز `models.providers.qianfan` إلا عندما تحتاج إلى عنوان URL أساسي مخصص أو بيانات تعريف للنموذج.
</Tip>

## مثال إعداد

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

<AccordionGroup>
  <Accordion title="النقل والتوافق">
    يعمل Qianfan عبر مسار نقل متوافق مع OpenAI، وليس عبر تشكيل طلبات OpenAI الأصلية. يعني هذا أن ميزات OpenAI SDK القياسية تعمل، لكن قد لا تُمرَّر المعلمات الخاصة بالمزوّد.
  </Accordion>

  <Accordion title="الكتالوج والتجاوزات">
    يتضمن الكتالوج الثابت حاليًا `deepseek-v3.2` و`ernie-5.0-thinking-preview`. أضف أو تجاوز `models.providers.qianfan` فقط عندما تحتاج إلى عنوان URL أساسي مخصص أو بيانات تعريف للنموذج.

    <Note>
    تستخدم مراجع النماذج البادئة `qianfan/` (على سبيل المثال `qianfan/deepseek-v3.2`).
    </Note>

  </Accordion>

  <Accordion title="استكشاف الأخطاء وإصلاحها">
    - تأكد من أن مفتاح API لديك يبدأ بـ `bce-v3/ALTAK-` وأن وصول Qianfan API مفعّل في وحدة تحكم Baidu Cloud.
    - إذا لم تكن النماذج مدرجة، فتأكد من تفعيل خدمة Qianfan في حسابك.
    - عنوان URL الأساسي الافتراضي هو `https://qianfan.baidubce.com/v2`. لا تغيّره إلا إذا كنت تستخدم نقطة نهاية مخصصة أو وكيلًا.

  </Accordion>
</AccordionGroup>

## ذات صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك تجاوز الفشل.
  </Card>
  <Card title="مرجع الإعداد" href="/ar/gateway/configuration-reference" icon="gear">
    مرجع إعداد OpenClaw الكامل.
  </Card>
  <Card title="إعداد الوكيل" href="/ar/concepts/agent" icon="robot">
    إعداد الإعدادات الافتراضية للوكلاء وتعيينات النماذج.
  </Card>
  <Card title="مستندات Qianfan API" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    وثائق Qianfan API الرسمية.
  </Card>
</CardGroup>
