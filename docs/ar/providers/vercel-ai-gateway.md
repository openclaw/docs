---
read_when:
    - تريد استخدام Vercel AI Gateway مع OpenClaw
    - تحتاج إلى متغير بيئة مفتاح API أو خيار مصادقة CLI
summary: إعداد Vercel AI Gateway (المصادقة + اختيار النموذج)
title: بوابة Vercel AI
x-i18n:
    generated_at: "2026-06-27T18:28:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 27aeeeff28661839f3be55c60bf1b383b95af78e17abb77441ae4e81f58688ed
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

يوفر [Vercel AI Gateway](https://vercel.com/ai-gateway) واجهة API موحدة للوصول إلى مئات النماذج عبر نقطة نهاية واحدة.

| الخاصية        | القيمة                                 |
| --------------- | -------------------------------------- |
| الموفر          | `vercel-ai-gateway`                    |
| الحزمة          | `@openclaw/vercel-ai-gateway-provider` |
| المصادقة        | `AI_GATEWAY_API_KEY`                   |
| API             | متوافق مع Anthropic Messages           |
| كتالوج النماذج | يُكتشف تلقائيًا عبر `/v1/models`       |

<Tip>
يكتشف OpenClaw تلقائيًا كتالوج Gateway `/v1/models`، لذلك يتضمن
`/models vercel-ai-gateway` مراجع النماذج الحالية مثل
`vercel-ai-gateway/openai/gpt-5.5` و
`vercel-ai-gateway/moonshotai/kimi-k2.6`.
</Tip>

## البدء

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/vercel-ai-gateway-provider
    ```
  </Step>
  <Step title="Set the API key">
    شغّل الإعداد الأولي واختر خيار مصادقة AI Gateway:

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="Set a default model">
    أضف النموذج إلى إعدادات OpenClaw الخاصة بك:

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
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## مثال غير تفاعلي

لعمليات الإعداد النصية أو إعدادات CI، مرّر كل القيم في سطر الأوامر:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## اختصار معرّف النموذج

يقبل OpenClaw مراجع نماذج Vercel Claude المختصرة ويطبّعها في وقت التشغيل:

| الإدخال المختصر                    | مرجع النموذج بعد التطبيع                    |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
يمكنك استخدام الاختصار أو مرجع النموذج المؤهل بالكامل في إعداداتك. يحل OpenClaw الصيغة القياسية تلقائيًا.
</Tip>

## الإعدادات المتقدمة

<AccordionGroup>
  <Accordion title="Environment variable for daemon processes">
    إذا كان OpenClaw Gateway يعمل كخدمة daemon (launchd/systemd)، فتأكد من أن
    `AI_GATEWAY_API_KEY` متاح لتلك العملية.

    <Warning>
    لن يكون المفتاح الذي يتم تصديره في shell تفاعلي فقط مرئيًا لخدمة daemon
    تعمل عبر launchd/systemd ما لم يتم استيراد تلك البيئة صراحةً. اضبط
    المفتاح في `~/.openclaw/.env` أو عبر `env.shellEnv` لضمان أن عملية Gateway
    يمكنها قراءته.
    </Warning>

  </Accordion>

  <Accordion title="Provider routing">
    يوجّه Vercel AI Gateway الطلبات إلى الموفر العلوي بناءً على بادئة مرجع
    النموذج. على سبيل المثال، يمر `vercel-ai-gateway/anthropic/claude-opus-4.6`
    عبر Anthropic، بينما يمر `vercel-ai-gateway/openai/gpt-5.5` عبر OpenAI ويمر
    `vercel-ai-gateway/moonshotai/kimi-k2.6` عبر MoonshotAI. يتولى مفتاحك
    الوحيد `AI_GATEWAY_API_KEY` المصادقة لكل الموفرين العلويين.
  </Accordion>
  <Accordion title="Thinking levels">
    تتبع خيارات `/think` بادئات النماذج العلوية الموثوقة عندما يعرف OpenClaw
    عقد الموفر العلوي. يستخدم `vercel-ai-gateway/anthropic/...` ملف تعريف تفكير
    Claude، بما في ذلك القيم الافتراضية التكيفية لنماذج Claude 4.6.
    تعرض `vercel-ai-gateway/openai/gpt-5.4` و`gpt-5.5` والمراجع بنمط Codex
    خيار `/think xhigh` تمامًا مثل موفري OpenAI/OpenAI Codex المباشرين. تحتفظ
    المراجع الأخرى ذات النطاقات بمستويات الاستدلال العادية ما لم تصرّح بيانات
    كتالوجها الوصفية بالمزيد.
  </Accordion>
</AccordionGroup>

## ذات صلة

<CardGroup cols={2}>
  <Card title="Model selection" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفرين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="Troubleshooting" href="/ar/help/troubleshooting" icon="wrench">
    استكشاف الأخطاء العام والأسئلة الشائعة.
  </Card>
</CardGroup>
