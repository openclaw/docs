---
read_when:
    - تريد استخدام Cloudflare AI Gateway مع OpenClaw
    - تحتاج إلى معرّف الحساب، أو معرّف Gateway، أو متغير البيئة الخاص بمفتاح API
summary: إعداد Cloudflare AI Gateway ‏(المصادقة + اختيار النموذج)
title: Cloudflare AI Gateway
x-i18n:
    generated_at: "2026-04-24T07:58:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb10ef4bd92db88b2b3dac1773439ab2ba37916a72d1925995d74ef787fa1c8b
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 15
---

يوضع Cloudflare AI Gateway أمام واجهات برمجة تطبيقات المزوّدين ويتيح لك إضافة التحليلات، والتخزين المؤقت، وعناصر التحكم. بالنسبة إلى Anthropic، يستخدم OpenClaw واجهة Anthropic Messages API عبر نقطة نهاية Gateway الخاصة بك.

| الخاصية         | القيمة                                                                                         |
| --------------- | ---------------------------------------------------------------------------------------------- |
| المزوّد         | `cloudflare-ai-gateway`                                                                        |
| Base URL        | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`                    |
| النموذج الافتراضي | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                     |
| مفتاح API       | `CLOUDFLARE_AI_GATEWAY_API_KEY` ‏(مفتاح API الخاص بالمزوّد لطلبات المرور عبر Gateway)         |

<Note>
بالنسبة إلى نماذج Anthropic الموجّهة عبر Cloudflare AI Gateway، استخدم **مفتاح Anthropic API** الخاص بك كمفتاح للمزوّد.
</Note>

## البدء

<Steps>
  <Step title="اضبط مفتاح API الخاص بالمزوّد وتفاصيل Gateway">
    شغّل onboarding واختر خيار مصادقة Cloudflare AI Gateway:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    سيطلب منك ذلك معرّف الحساب، ومعرّف Gateway، ومفتاح API.

  </Step>
  <Step title="اضبط نموذجًا افتراضيًا">
    أضف النموذج إلى تكوين OpenClaw الخاص بك:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "cloudflare-ai-gateway/claude-sonnet-4-6" },
        },
      },
    }
    ```

  </Step>
  <Step title="تحقّق من توفر النموذج">
    ```bash
    openclaw models list --provider cloudflare-ai-gateway
    ```
  </Step>
</Steps>

## مثال غير تفاعلي

بالنسبة إلى الإعدادات المكتوبة بسكربتات أو CI، مرر جميع القيم عبر سطر الأوامر:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cloudflare-ai-gateway-api-key \
  --cloudflare-ai-gateway-account-id "your-account-id" \
  --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
  --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY"
```

## التكوين المتقدم

<AccordionGroup>
  <Accordion title="بوابات مصادق عليها">
    إذا كنت قد فعّلت مصادقة Gateway في Cloudflare، فأضف الترويسة `cf-aig-authorization`. وهذا يكون **بالإضافة إلى** مفتاح API الخاص بالمزوّد.

    ```json5
    {
      models: {
        providers: {
          "cloudflare-ai-gateway": {
            headers: {
              "cf-aig-authorization": "Bearer <cloudflare-ai-gateway-token>",
            },
          },
        },
      },
    }
    ```

    <Tip>
    تقوم الترويسة `cf-aig-authorization` بالمصادقة مع Cloudflare Gateway نفسها، بينما يقوم مفتاح API الخاص بالمزوّد (مثل مفتاح Anthropic الخاص بك) بالمصادقة مع المزوّد upstream.
    </Tip>

  </Accordion>

  <Accordion title="ملاحظة حول البيئة">
    إذا كان Gateway يعمل كـ daemon ‏(launchd/systemd)، فتأكد من أن `CLOUDFLARE_AI_GATEWAY_API_KEY` متاح لتلك العملية.

    <Warning>
    لن يفيد وجود مفتاح في `~/.profile` فقط daemon يعمل عبر launchd/systemd ما لم يتم استيراد تلك البيئة هناك أيضًا. اضبط المفتاح في `~/.openclaw/.env` أو عبر `env.shellEnv` لضمان أن عملية gateway تستطيع قراءته.
    </Warning>

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك الاحتياط.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    استكشاف الأخطاء وإصلاحها والأسئلة الشائعة العامة.
  </Card>
</CardGroup>
