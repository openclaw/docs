---
read_when:
    - تريد مفتاح API واحدًا للعديد من نماذج LLM
    - تحتاج إلى إرشادات إعداد Baidu Qianfan
summary: استخدم API الموحّد من Qianfan للوصول إلى العديد من النماذج في OpenClaw
title: Qianfan
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-24T08:00:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 727236394f6581f5bdb2f557092c31ff7904e4a80b06f8adc07a1c51dcfb2ff1
    source_path: providers/qianfan.md
    workflow: 15
---

Qianfan هي منصة MaaS من Baidu، وتوفّر **API موحّدًا** يوجّه الطلبات إلى العديد من النماذج خلف
نقطة نهاية واحدة ومفتاح API واحد. وهي متوافقة مع OpenAI، لذلك تعمل معظم حِزم SDK الخاصة بـ OpenAI بمجرد تبديل Base URL.

| الخاصية | القيمة                            |
| -------- | --------------------------------- |
| الموفّر | `qianfan`                         |
| المصادقة | `QIANFAN_API_KEY`                 |
| API      | متوافق مع OpenAI                 |
| Base URL | `https://qianfan.baidubce.com/v2` |

## البدء

<Steps>
  <Step title="أنشئ حساب Baidu Cloud">
    سجّل أو سجّل الدخول عبر [Qianfan Console](https://console.bce.baidu.com/qianfan/ais/console/apiKey) وتأكد من تفعيل الوصول إلى Qianfan API.
  </Step>
  <Step title="أنشئ مفتاح API">
    أنشئ تطبيقًا جديدًا أو اختر تطبيقًا موجودًا، ثم أنشئ مفتاح API. يكون تنسيق المفتاح هو `bce-v3/ALTAK-...`.
  </Step>
  <Step title="شغّل الإعداد الأولي">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```
  </Step>
  <Step title="تحقق من توفر النموذج">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## الفهرس المضمن

| مرجع النموذج                         | الإدخال      | السياق  | الحد الأقصى للإخراج | الاستدلال | ملاحظات         |
| ------------------------------------ | ------------ | ------- | ------------------- | --------- | --------------- |
| `qianfan/deepseek-v3.2`              | نص           | 98,304  | 32,768              | نعم       | النموذج الافتراضي |
| `qianfan/ernie-5.0-thinking-preview` | نص، صورة     | 119,000 | 64,000              | نعم       | متعدد الوسائط    |

<Tip>
مرجع النموذج المضمن الافتراضي هو `qianfan/deepseek-v3.2`. لا تحتاج إلى تجاوز `models.providers.qianfan` إلا عندما تحتاج إلى Base URL مخصص أو بيانات وصفية مخصصة للنموذج.
</Tip>

## مثال على التهيئة

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
    يعمل Qianfan عبر مسار النقل المتوافق مع OpenAI، وليس عبر تشكيل الطلبات الأصلي الخاص بـ OpenAI. وهذا يعني أن ميزات OpenAI SDK القياسية تعمل، لكن قد لا يتم تمرير المعلمات الخاصة بالموفّر.
  </Accordion>

  <Accordion title="الفهرس والتجاوزات">
    يتضمن الفهرس المضمن حاليًا `deepseek-v3.2` و`ernie-5.0-thinking-preview`. أضف أو تجاوز `models.providers.qianfan` فقط عندما تحتاج إلى Base URL مخصص أو بيانات وصفية مخصصة للنموذج.

    <Note>
    تستخدم مراجع النماذج البادئة `qianfan/` (على سبيل المثال `qianfan/deepseek-v3.2`).
    </Note>

  </Accordion>

  <Accordion title="استكشاف الأخطاء وإصلاحها">
    - تأكد من أن مفتاح API يبدأ بـ `bce-v3/ALTAK-` وأن الوصول إلى Qianfan API مفعّل له في وحدة تحكم Baidu Cloud.
    - إذا لم تُدرج النماذج، فتأكد من أن خدمة Qianfan مفعلة في حسابك.
    - تكون Base URL الافتراضية هي `https://qianfan.baidubce.com/v2`. لا تغيّرها إلا إذا كنت تستخدم نقطة نهاية أو proxy مخصصًا.
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفّرين، ومراجع النماذج، وسلوك التبديل الاحتياطي.
  </Card>
  <Card title="مرجع التهيئة" href="/ar/gateway/configuration-reference" icon="gear">
    المرجع الكامل لتهيئة OpenClaw.
  </Card>
  <Card title="إعداد الوكيل" href="/ar/concepts/agent" icon="robot">
    تهيئة الإعدادات الافتراضية للوكيل وتعيينات النماذج.
  </Card>
  <Card title="مستندات API الخاصة بـ Qianfan" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    الوثائق الرسمية لـ Qianfan API.
  </Card>
</CardGroup>
