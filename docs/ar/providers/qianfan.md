---
read_when:
    - تريد مفتاح API واحدًا للعديد من نماذج اللغة الكبيرة
    - تحتاج إلى إرشادات إعداد Baidu Qianfan
summary: استخدم واجهة API الموحّدة الخاصة بـ Qianfan للوصول إلى العديد من النماذج في OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-04-30T08:22:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6adfbad6c18bf2bcf93d9c56c51591c862ebb751ffd8183015fa2fc9566ce0af
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan هي منصة MaaS من Baidu، وتوفّر **واجهة API موحّدة** توجّه الطلبات إلى العديد من النماذج خلف
نقطة نهاية واحدة ومفتاح API واحد. وهي متوافقة مع OpenAI، لذا تعمل معظم SDKs الخاصة بـ OpenAI عبر تبديل عنوان URL الأساسي.

| الخاصية | القيمة                           |
| -------- | --------------------------------- |
| المزوّد | `qianfan`                         |
| المصادقة | `QIANFAN_API_KEY`                 |
| API      | متوافقة مع OpenAI                 |
| عنوان URL الأساسي | `https://qianfan.baidubce.com/v2` |

## بدء الاستخدام

<Steps>
  <Step title="Create a Baidu Cloud account">
    سجّل أو ادخل إلى [وحدة تحكم Qianfan](https://console.bce.baidu.com/qianfan/ais/console/apiKey) وتأكد من تمكين وصولك إلى Qianfan API.
  </Step>
  <Step title="Generate an API key">
    أنشئ تطبيقًا جديدًا أو اختر تطبيقًا موجودًا، ثم أنشئ مفتاح API. صيغة المفتاح هي `bce-v3/ALTAK-...`.
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```
  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## الكتالوج المضمّن

| مرجع النموذج                         | الإدخال     | السياق | الحد الأقصى للمخرجات | الاستدلال | ملاحظات       |
| ------------------------------------ | ----------- | ------- | ---------- | --------- | ------------- |
| `qianfan/deepseek-v3.2`              | نص          | 98,304  | 32,768     | نعم       | النموذج الافتراضي |
| `qianfan/ernie-5.0-thinking-preview` | نص، صورة    | 119,000 | 64,000     | نعم       | متعدد الوسائط |

<Tip>
مرجع النموذج المضمّن الافتراضي هو `qianfan/deepseek-v3.2`. لا تحتاج إلى تجاوز `models.providers.qianfan` إلا عندما تحتاج إلى عنوان URL أساسي مخصص أو بيانات وصفية للنموذج.
</Tip>

## مثال تكوين

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
  <Accordion title="Transport and compatibility">
    يعمل Qianfan عبر مسار النقل المتوافق مع OpenAI، وليس عبر تشكيل طلبات OpenAI الأصلي. يعني ذلك أن ميزات SDK القياسية الخاصة بـ OpenAI تعمل، لكن قد لا يتم تمرير المعلمات الخاصة بالمزوّد.
  </Accordion>

  <Accordion title="Catalog and overrides">
    يتضمن الكتالوج المضمّن حاليًا `deepseek-v3.2` و`ernie-5.0-thinking-preview`. أضف أو تجاوز `models.providers.qianfan` فقط عندما تحتاج إلى عنوان URL أساسي مخصص أو بيانات وصفية للنموذج.

    <Note>
    تستخدم مراجع النماذج البادئة `qianfan/` (على سبيل المثال `qianfan/deepseek-v3.2`).
    </Note>

  </Accordion>

  <Accordion title="Troubleshooting">
    - تأكد من أن مفتاح API يبدأ بـ `bce-v3/ALTAK-` وأن وصول Qianfan API مفعّل في وحدة تحكم Baidu Cloud.
    - إذا لم تكن النماذج مدرجة، فتأكد من تنشيط خدمة Qianfan في حسابك.
    - عنوان URL الأساسي الافتراضي هو `https://qianfan.baidubce.com/v2`. لا تغيّره إلا إذا كنت تستخدم نقطة نهاية مخصصة أو وكيلًا.

  </Accordion>
</AccordionGroup>

## ذات صلة

<CardGroup cols={2}>
  <Card title="Model selection" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="Configuration reference" href="/ar/gateway/configuration-reference" icon="gear">
    مرجع تكوين OpenClaw الكامل.
  </Card>
  <Card title="Agent setup" href="/ar/concepts/agent" icon="robot">
    تكوين افتراضيات الوكيل وتعيينات النماذج.
  </Card>
  <Card title="Qianfan API docs" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    وثائق Qianfan API الرسمية.
  </Card>
</CardGroup>
