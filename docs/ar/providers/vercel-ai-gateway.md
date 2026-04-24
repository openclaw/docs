---
read_when:
    - تريد استخدام Vercel AI Gateway مع OpenClaw
    - تحتاج إلى متغير البيئة الخاص بمفتاح API أو خيار مصادقة CLI
summary: إعداد Vercel AI Gateway ‏(المصادقة + اختيار النموذج)
title: Vercel AI gateway
x-i18n:
    generated_at: "2026-04-24T08:01:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1fa1c3c6e44e40d7a1fc89d93ee268c19124b746d4644d58014157be7cceeb9
    source_path: providers/vercel-ai-gateway.md
    workflow: 15
---

يوفر [Vercel AI Gateway](https://vercel.com/ai-gateway) API موحدًا
للوصول إلى مئات النماذج عبر نقطة نهاية واحدة.

| الخاصية      | القيمة                           |
| ------------- | -------------------------------- |
| الموفّر      | `vercel-ai-gateway`              |
| المصادقة     | `AI_GATEWAY_API_KEY`             |
| API          | متوافق مع Anthropic Messages     |
| فهرس النماذج | يُكتشف تلقائيًا عبر `/v1/models` |

<Tip>
يكتشف OpenClaw تلقائيًا فهرس Gateway ‏`/v1/models`، لذلك يتضمن
`/models vercel-ai-gateway` مراجع النماذج الحالية مثل
`vercel-ai-gateway/openai/gpt-5.5` و
`vercel-ai-gateway/moonshotai/kimi-k2.6`.
</Tip>

## البدء

<Steps>
  <Step title="اضبط مفتاح API">
    شغّل الإعداد الأولي واختر خيار مصادقة AI Gateway:

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="اضبط نموذجًا افتراضيًا">
    أضف النموذج إلى تهيئة OpenClaw الخاصة بك:

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
  <Step title="تحقق من توفر النموذج">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## مثال غير تفاعلي

بالنسبة إلى الإعدادات المؤتمتة أو إعدادات CI، مرّر جميع القيم على سطر الأوامر:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## الصيغة المختصرة لمعرّف النموذج

يقبل OpenClaw مراجع نماذج Claude المختصرة الخاصة بـ Vercel ويطبّعها أثناء
التشغيل:

| الإدخال المختصر                    | مرجع النموذج المطبع                          |
| ---------------------------------- | ------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
يمكنك استخدام الصيغة المختصرة أو مرجع النموذج المؤهل بالكامل في
التهيئة الخاصة بك. يحل OpenClaw الصيغة القياسية تلقائيًا.
</Tip>

## التهيئة المتقدمة

<AccordionGroup>
  <Accordion title="متغير البيئة لعمليات daemon">
    إذا كان OpenClaw Gateway يعمل كخدمة daemon ‏(`launchd`/`systemd`)، فتأكد من أن
    `AI_GATEWAY_API_KEY` متاح لتلك العملية.

    <Warning>
    لن يكون المفتاح المضبوط فقط في `~/.profile` مرئيًا لخدمة daemon تعمل عبر `launchd`/`systemd`
    ما لم يتم استيراد تلك البيئة صراحةً. اضبط المفتاح في
    `~/.openclaw/.env` أو عبر `env.shellEnv` لضمان أن تتمكن عملية gateway من
    قراءته.
    </Warning>

  </Accordion>

  <Accordion title="توجيه الموفّر">
    يوجّه Vercel AI Gateway الطلبات إلى الموفّر الصاعد استنادًا إلى بادئة مرجع النموذج.
    على سبيل المثال، يوجَّه `vercel-ai-gateway/anthropic/claude-opus-4.6`
    عبر Anthropic، بينما يوجَّه `vercel-ai-gateway/openai/gpt-5.5` عبر
    OpenAI ويوجَّه `vercel-ai-gateway/moonshotai/kimi-k2.6` عبر
    MoonshotAI. ويتولى `AI_GATEWAY_API_KEY` الواحد الخاص بك المصادقة لجميع
    الموفّرين الصاعدين.
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفّرين، ومراجع النماذج، وسلوك التبديل الاحتياطي.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    استكشاف الأخطاء وإصلاحها بشكل عام والأسئلة الشائعة.
  </Card>
</CardGroup>
