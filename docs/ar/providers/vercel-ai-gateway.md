---
read_when:
    - تريد استخدام Vercel AI Gateway مع OpenClaw
    - تحتاج إلى متغير البيئة الخاص بمفتاح واجهة برمجة التطبيقات أو خيار المصادقة في CLI
summary: إعداد Vercel AI Gateway (المصادقة + اختيار النموذج)
title: Gateway الذكاء الاصطناعي من Vercel
x-i18n:
    generated_at: "2026-04-30T08:23:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3bbe498a04c2073020fcfbbe68cb506eca4c52c3274e4eca6ab7e6893fcfa56
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

يوفّر [Vercel AI Gateway](https://vercel.com/ai-gateway) واجهة API موحّدة
للوصول إلى مئات النماذج عبر نقطة نهاية واحدة.

| الخاصية      | القيمة                            |
| ------------- | -------------------------------- |
| المزوّد      | `vercel-ai-gateway`              |
| المصادقة          | `AI_GATEWAY_API_KEY`             |
| API           | متوافق مع Anthropic Messages    |
| كتالوج النماذج | يُكتشف تلقائيًا عبر `/v1/models` |

<Tip>
يكتشف OpenClaw تلقائيًا كتالوج Gateway `/v1/models`، لذلك
يتضمن `/models vercel-ai-gateway` مراجع النماذج الحالية مثل
`vercel-ai-gateway/openai/gpt-5.5` و
`vercel-ai-gateway/moonshotai/kimi-k2.6`.
</Tip>

## بدء الاستخدام

<Steps>
  <Step title="Set the API key">
    شغّل الإعداد الأولي واختر خيار مصادقة AI Gateway:

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="Set a default model">
    أضف النموذج إلى إعدادات OpenClaw لديك:

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

لإعدادات السكربتات أو CI، مرّر كل القيم في سطر الأوامر:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## الاختصار المختصر لمعرّف النموذج

يقبل OpenClaw مراجع نماذج Vercel Claude المختصرة ويطبعها بالشكل الطبيعي
أثناء التشغيل:

| الإدخال المختصر                     | مرجع النموذج بعد التطبيع                          |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
يمكنك استخدام الاختصار أو مرجع النموذج المؤهل بالكامل في
إعداداتك. يحل OpenClaw الصيغة القانونية تلقائيًا.
</Tip>

## الإعدادات المتقدمة

<AccordionGroup>
  <Accordion title="Environment variable for daemon processes">
    إذا كان OpenClaw Gateway يعمل كخدمة خلفية (launchd/systemd)، فتأكد من
    إتاحة `AI_GATEWAY_API_KEY` لهذه العملية.

    <Warning>
    لن يكون المفتاح المعيّن فقط في `~/.profile` مرئيًا لخدمة خلفية launchd/systemd
    ما لم تُستورد تلك البيئة صراحةً. عيّن المفتاح في
    `~/.openclaw/.env` أو عبر `env.shellEnv` لضمان أن عملية gateway يمكنها
    قراءته.
    </Warning>

  </Accordion>

  <Accordion title="Provider routing">
    يوجّه Vercel AI Gateway الطلبات إلى المزوّد العلوي بناءً على بادئة مرجع النموذج.
    على سبيل المثال، يوجّه `vercel-ai-gateway/anthropic/claude-opus-4.6`
    عبر Anthropic، بينما يوجّه `vercel-ai-gateway/openai/gpt-5.5` عبر
    OpenAI ويوجّه `vercel-ai-gateway/moonshotai/kimi-k2.6` عبر
    MoonshotAI. يتولى `AI_GATEWAY_API_KEY` الوحيد لديك المصادقة لكل
    المزوّدين العلويين.
  </Accordion>
  <Accordion title="Thinking levels">
    تتبع خيارات `/think` بادئات النماذج العلوية الموثوقة عندما يعرف OpenClaw
    عقد المزوّد العلوي. يستخدم `vercel-ai-gateway/anthropic/...` ملف تعريف
    التفكير الخاص بـ Claude، بما في ذلك القيم الافتراضية التكيفية لنماذج Claude 4.6.
    تعرض مراجع `vercel-ai-gateway/openai/gpt-5.4` و`gpt-5.5` ومراجع نمط Codex
    خيار `/think xhigh` تمامًا مثل مزوّدي OpenAI/OpenAI Codex المباشرين. تحتفظ
    المراجع الأخرى ذات مساحات الأسماء بمستويات الاستدلال العادية ما لم تعلن
    بيانات كتالوجها الوصفية عن المزيد.
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="Model selection" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك تجاوز الفشل.
  </Card>
  <Card title="Troubleshooting" href="/ar/help/troubleshooting" icon="wrench">
    استكشاف الأخطاء العامة وإصلاحها والأسئلة الشائعة.
  </Card>
</CardGroup>
