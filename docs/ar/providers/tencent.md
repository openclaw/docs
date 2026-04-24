---
read_when:
    - تريد استخدام Tencent Hy3 preview مع OpenClaw
    - تحتاج إلى إعداد مفتاح API الخاص بـ TokenHub
summary: إعداد Tencent Cloud TokenHub لـ Hy3 preview
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-04-24T08:01:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: c64afffc66dccca256ec658235ae1fbc18e46608b594bc07875118f54b2a494d
    source_path: providers/tencent.md
    workflow: 15
---

# Tencent Cloud TokenHub

يشحن Tencent Cloud بوصفه **Plugin موفّرًا مضمّنًا** في OpenClaw. ويوفر الوصول إلى Tencent Hy3 preview عبر نقطة نهاية TokenHub ‏(`tencent-tokenhub`).

يستخدم الموفّر API متوافقًا مع OpenAI.

| الخاصية      | القيمة                                     |
| ------------- | ------------------------------------------ |
| الموفّر      | `tencent-tokenhub`                         |
| النموذج الافتراضي | `tencent-tokenhub/hy3-preview`       |
| المصادقة     | `TOKENHUB_API_KEY`                         |
| API          | إكمالات دردشة متوافقة مع OpenAI           |
| Base URL     | `https://tokenhub.tencentmaas.com/v1`      |
| Global URL   | `https://tokenhub-intl.tencentmaas.com/v1` |

## البدء السريع

<Steps>
  <Step title="أنشئ مفتاح API لـ TokenHub">
    أنشئ مفتاح API في Tencent Cloud TokenHub. وإذا اخترت نطاق وصول محدودًا للمفتاح، فأدرج **Hy3 preview** ضمن النماذج المسموح بها.
  </Step>
  <Step title="شغّل الإعداد الأولي">
    ```bash
    openclaw onboard --auth-choice tokenhub-api-key
    ```
  </Step>
  <Step title="تحقق من النموذج">
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

## الفهرس المضمن

| مرجع النموذج                   | الاسم                  | الإدخال | السياق  | الحد الأقصى للإخراج | ملاحظات                      |
| ------------------------------ | ---------------------- | ------- | ------- | ------------------- | ---------------------------- |
| `tencent-tokenhub/hy3-preview` | Hy3 preview (TokenHub) | text    | 256,000 | 64,000              | الافتراضي؛ مع تمكين الاستدلال |

يعد Hy3 preview نموذج اللغة الكبير MoE من Tencent Hunyuan للاستدلال، واتباع التعليمات ضمن سياق طويل، والبرمجة، وتدفقات عمل الوكلاء. وتستخدم أمثلة Tencent المتوافقة مع OpenAI المعرّف `hy3-preview` بوصفه معرّف النموذج، كما تدعم استدعاء الأدوات القياسي في chat-completions بالإضافة إلى `reasoning_effort`.

<Tip>
معرّف النموذج هو `hy3-preview`. لا تخلط بينه وبين نماذج Tencent من نوع `HY-3D-*`، فهي APIs لتوليد ثلاثي الأبعاد وليست نموذج الدردشة في OpenClaw الذي يهيئه هذا الموفّر.
</Tip>

## تجاوز نقطة النهاية

يضبط OpenClaw افتراضيًا نقطة النهاية `https://tokenhub.tencentmaas.com/v1` الخاصة بـ Tencent Cloud. وتوثّق Tencent أيضًا نقطة نهاية دولية لـ TokenHub:

```bash
openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
```

لا تتجاوز نقطة النهاية إلا عندما يتطلب حساب TokenHub أو منطقتك ذلك.

## ملاحظات

- تستخدم مراجع نماذج TokenHub الصيغة `tencent-tokenhub/<modelId>`.
- يتضمن الفهرس المضمن حاليًا `hy3-preview`.
- يضع Plugin علامة على Hy3 preview بوصفه قادرًا على الاستدلال ومتوافقًا مع استخدام البث.
- يشحن Plugin بيانات وصفية لتسعير Hy3 المتدرج، لذلك تُملأ تقديرات التكلفة من دون تجاوزات تسعير يدوية.
- تجاوز بيانات التسعير أو السياق أو نقطة النهاية الوصفية في `models.providers` فقط عند الحاجة.

## ملاحظة حول البيئة

إذا كان Gateway يعمل كخدمة daemon ‏(`launchd`/`systemd`)، فتأكد من أن `TOKENHUB_API_KEY`
متاح لتلك العملية (على سبيل المثال في `~/.openclaw/.env` أو عبر
`env.shellEnv`).

## الوثائق ذات الصلة

- [OpenClaw Configuration](/ar/gateway/configuration)
- [Model Providers](/ar/concepts/model-providers)
- [صفحة منتج Tencent TokenHub](https://cloud.tencent.com/product/tokenhub)
- [توليد النص في Tencent TokenHub](https://cloud.tencent.com/document/product/1823/130079)
- [إعداد Tencent TokenHub Cline لـ Hy3 preview](https://cloud.tencent.com/document/product/1823/130932)
- [بطاقة نموذج Tencent Hy3 preview](https://huggingface.co/tencent/Hy3-preview)
