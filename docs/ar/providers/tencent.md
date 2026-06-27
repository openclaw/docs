---
read_when:
    - تريد استخدام معاينة Tencent Hy3 مع OpenClaw
    - تحتاج إلى إعداد مفتاح API الخاص بـ TokenHub
summary: إعداد Tencent Cloud TokenHub لمعاينة Hy3
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-06-27T18:27:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62bcdd795cc0334f409405fa7c369ed9966854616a89dbc7153f91ee349895ad
    source_path: providers/tencent.md
    workflow: 16
---

ثبّت Plugin مزود Tencent Cloud الرسمي للوصول إلى Tencent Hy3 preview عبر نقطة نهاية TokenHub (`tencent-tokenhub`) باستخدام API متوافقة مع OpenAI.

| الخاصية             | القيمة                                                |
| ------------------- | ----------------------------------------------------- |
| معرّف المزود        | `tencent-tokenhub`                                    |
| الحزمة              | `@openclaw/tencent-provider`                          |
| متغير بيئة المصادقة | `TOKENHUB_API_KEY`                                    |
| علم الإعداد الأولي  | `--auth-choice tokenhub-api-key`                      |
| علم CLI المباشر     | `--tokenhub-api-key <key>`                            |
| API                 | متوافقة مع OpenAI (`openai-completions`)              |
| عنوان URL الأساسي الافتراضي | `https://tokenhub.tencentmaas.com/v1`                 |
| عنوان URL الأساسي العام | `https://tokenhub-intl.tencentmaas.com/v1` (تجاوز) |
| النموذج الافتراضي   | `tencent-tokenhub/hy3-preview`                        |

## البدء السريع

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/tencent-provider
    ```
  </Step>
  <Step title="Create a TokenHub API key">
    أنشئ مفتاح API في Tencent Cloud TokenHub. إذا اخترت نطاق وصول محدودًا للمفتاح، فأدرج **Hy3 preview** ضمن النماذج المسموح بها.
  </Step>
  <Step title="Run onboarding">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice tokenhub-api-key
```

```bash Direct flag
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash Env only
export TOKENHUB_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="Verify the model">
    ```bash
    openclaw models list --provider tencent-tokenhub
    ```
  </Step>
</Steps>

## إعداد غير تفاعلي

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## الكتالوج المدمج

| مرجع النموذج                   | الاسم                  | الإدخال | السياق | الحد الأقصى للإخراج | ملاحظات                         |
| ------------------------------ | ---------------------- | ------- | ------- | ------------------- | ------------------------------- |
| `tencent-tokenhub/hy3-preview` | Hy3 preview (TokenHub) | نص      | 256,000 | 64,000              | افتراضي؛ مفعّل للاستدلال |

Hy3 preview هو نموذج Tencent Hunyuan اللغوي الكبير من نوع MoE للاستدلال، واتباع التعليمات ذات السياق الطويل، والبرمجة، وتدفقات عمل الوكلاء. تستخدم أمثلة Tencent المتوافقة مع OpenAI القيمة `hy3-preview` كمعرّف للنموذج، وتدعم استدعاء الأدوات القياسي في chat-completions بالإضافة إلى `reasoning_effort`.

<Tip>
  معرّف النموذج هو `hy3-preview`. لا تخلط بينه وبين نماذج Tencent من نوع `HY-3D-*`، فهي واجهات API لتوليد ثلاثي الأبعاد وليست نموذج محادثة OpenClaw الذي يهيئه هذا المزود.
</Tip>

## تسعير متعدد المستويات

يشحن كتالوج المزود بيانات وصفية للتكلفة متعددة المستويات تتدرج حسب طول نافذة الإدخال، لذلك تُملأ تقديرات التكلفة دون تجاوزات يدوية.

| نطاق رموز الإدخال | سعر الإدخال | سعر الإخراج | قراءة التخزين المؤقت |
| ----------------- | ----------- | ------------ | -------------------- |
| 0 - 16,000        | 0.176       | 0.587        | 0.059                |
| 16,000 - 32,000   | 0.235       | 0.939        | 0.088                |
| 32,000+           | 0.293       | 1.173        | 0.117                |

الأسعار لكل مليون رمز بالدولار الأمريكي كما تعلن Tencent. تجاوز التسعير ضمن `models.providers.tencent-tokenhub` فقط عندما تحتاج إلى سطح مختلف.

## التكوين المتقدم

<AccordionGroup>
  <Accordion title="Endpoint override">
    يستخدم OpenClaw افتراضيًا نقطة نهاية Tencent Cloud وهي `https://tokenhub.tencentmaas.com/v1`. توثق Tencent أيضًا نقطة نهاية دولية لـ TokenHub:

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
    ```

    لا تتجاوز نقطة النهاية إلا عندما يتطلب حساب TokenHub أو منطقتك ذلك.

  </Accordion>

  <Accordion title="Environment availability for the daemon">
    إذا كان Gateway يعمل كخدمة مُدارة (launchd أو systemd أو Docker)، فيجب أن يكون `TOKENHUB_API_KEY` مرئيًا لتلك العملية. عيّنه في `~/.openclaw/.env` أو عبر `env.shellEnv` كي تتمكن بيئات launchd أو systemd أو Docker exec من قراءته.

    <Warning>
      المفاتيح المصدّرة فقط في صدفة تفاعلية لا تكون مرئية لعمليات Gateway المُدارة. استخدم ملف البيئة أو وصلة التكوين لضمان التوفر المستمر.
    </Warning>

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="Model providers" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزودين، ومراجع النماذج، وسلوك تجاوز الفشل.
  </Card>
  <Card title="Configuration reference" href="/ar/gateway/configuration" icon="gear">
    مخطط التكوين الكامل، بما في ذلك إعدادات المزود.
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    صفحة منتج TokenHub من Tencent Cloud.
  </Card>
  <Card title="Hy3 preview model card" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    تفاصيل ومعايير أداء Tencent Hunyuan Hy3 preview.
  </Card>
</CardGroup>
