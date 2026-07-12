---
read_when:
    - تريد استخدام Vercel AI Gateway مع OpenClaw
    - تحتاج إلى متغير البيئة الخاص بمفتاح API أو اختيار المصادقة عبر CLI
summary: إعداد Vercel AI Gateway (المصادقة + اختيار النموذج)
title: بوابة Vercel للذكاء الاصطناعي
x-i18n:
    generated_at: "2026-07-12T06:25:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c1e4776604491900a914e75caebfd7e27a81e9f859213f5bd5b25582a923d92a
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

توفّر [Vercel AI Gateway](https://vercel.com/ai-gateway) واجهة API موحّدة للوصول إلى
مئات النماذج من خلال نقطة نهاية واحدة.

| الخاصية      | القيمة                                  |
| ------------- | -------------------------------------- |
| المزوّد      | `vercel-ai-gateway`                    |
| الحزمة       | `@openclaw/vercel-ai-gateway-provider` |
| المصادقة     | `AI_GATEWAY_API_KEY`                   |
| API           | متوافقة مع Anthropic Messages          |
| عنوان URL الأساسي | `https://ai-gateway.vercel.sh`         |
| دليل النماذج | يُكتشف تلقائيًا عبر `/v1/models`       |

<Tip>
يكتشف OpenClaw تلقائيًا دليل Gateway في `/v1/models`، لذا يتضمن كل من
أمر الدردشة `/models vercel-ai-gateway` والأمر
`openclaw models list --provider vercel-ai-gateway` مراجع النماذج الحالية
مثل `vercel-ai-gateway/openai/gpt-5.5` و
`vercel-ai-gateway/moonshotai/kimi-k2.6`.
</Tip>

## بدء الاستخدام

<Steps>
  <Step title="تثبيت Plugin">
    ```bash
    openclaw plugins install @openclaw/vercel-ai-gateway-provider
    ```
  </Step>
  <Step title="تعيين مفتاح API">
    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```
  </Step>
  <Step title="تعيين نموذج افتراضي">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vercel-ai-gateway/anthropic/claude-opus-4.6" },
        },
      },
    }
    ```
  </Step>
  <Step title="التحقق من توفر النموذج">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## مثال غير تفاعلي

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## الصيغة المختصرة لمعرّف النموذج

يوحّد OpenClaw مراجع النماذج المختصرة لـ Claude في وقت التشغيل:

| الإدخال المختصر                     | مرجع النموذج الموحّد                          |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
استخدم أيًا من الصيغتين في إعداداتك؛ يحل OpenClaw المرجع القياسي
`anthropic/...` تلقائيًا.
</Tip>

## الإعدادات المتقدمة

<AccordionGroup>
  <Accordion title="متغير البيئة لعمليات الخدمة الخلفية">
    إذا كان OpenClaw Gateway يعمل كخدمة خلفية (launchd/systemd)، فتأكد من
    إتاحة `AI_GATEWAY_API_KEY` لتلك العملية.

    <Warning>
    لن يكون المفتاح الذي يُصدَّر في صدفة تفاعلية فقط مرئيًا لخدمة
    launchd/systemd ما لم تُستورد تلك البيئة صراحةً. عيّن
    المفتاح في `~/.openclaw/.env` أو عبر `env.shellEnv` لضمان قدرة عملية Gateway
    على قراءته.
    </Warning>

  </Accordion>

  <Accordion title="توجيه المزوّد">
    توجّه Vercel AI Gateway كل طلب إلى المزوّد المنبع المحدد في بادئة
    مرجع النموذج. على سبيل المثال، يُوجَّه `vercel-ai-gateway/anthropic/claude-opus-4.6`
    عبر Anthropic، ويُوجَّه `vercel-ai-gateway/openai/gpt-5.5` عبر
    OpenAI، ويُوجَّه `vercel-ai-gateway/moonshotai/kimi-k2.6` عبر
    MoonshotAI. يصادق مفتاح `AI_GATEWAY_API_KEY` واحد لدى جميع المزوّدين المنبع.
  </Accordion>
  <Accordion title="مستويات التفكير">
    تتبع خيارات `/think` بادئة النموذج المنبع عندما يتعرّف عليها OpenClaw.
    يستخدم `vercel-ai-gateway/anthropic/...` ملف تفكير Claude،
    بما في ذلك الإعداد الافتراضي التكيفي لنماذج Claude 4.6. تتيح مراجع
    `vercel-ai-gateway/openai/...` الموثوقة (`gpt-5.2` والإصدارات الأحدث، بالإضافة إلى متغيرات Codex
    وصولًا إلى `gpt-5.1-codex`) الخيار `/think xhigh`. تحتفظ المراجع الأخرى ذات
    نطاقات الأسماء بمستويات الاستدلال القياسية ما لم تُصرّح البيانات الوصفية
    لدليلها بمستويات إضافية.
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    إرشادات عامة لاستكشاف الأخطاء وإصلاحها والأسئلة الشائعة.
  </Card>
</CardGroup>
