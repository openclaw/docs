---
read_when:
    - تريد استخدام Cloudflare AI Gateway مع OpenClaw
    - تحتاج إلى معرّف الحساب أو معرّف Gateway أو متغيّر البيئة لمفتاح API
summary: إعداد Cloudflare AI Gateway (المصادقة + اختيار النموذج)
title: Gateway الذكاء الاصطناعي من Cloudflare
x-i18n:
    generated_at: "2026-04-30T08:20:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7c567076a5b3fea0f09f44d772c0858aed2a4813f91f1cc9f87b0da39c2e5db
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

يقع Cloudflare AI Gateway أمام واجهات API للمزوّدين ويتيح لك إضافة التحليلات والتخزين المؤقت وعناصر التحكم. بالنسبة إلى Anthropic، يستخدم OpenClaw واجهة Anthropic Messages API عبر نقطة نهاية Gateway الخاصة بك.

| الخاصية | القيمة |
| ------------- | ---------------------------------------------------------------------------------------- |
| المزوّد | `cloudflare-ai-gateway`                                                                  |
| عنوان URL الأساسي | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| النموذج الافتراضي | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                |
| مفتاح API | `CLOUDFLARE_AI_GATEWAY_API_KEY` (مفتاح API الخاص بالمزوّد لديك للطلبات عبر Gateway) |

<Note>
بالنسبة إلى نماذج Anthropic الموجّهة عبر Cloudflare AI Gateway، استخدم **مفتاح Anthropic API** الخاص بك كمفتاح المزوّد.
</Note>

عند تمكين التفكير لنماذج Anthropic Messages، يزيل OpenClaw أدوار
الملء المسبق اللاحقة الخاصة بالمساعد قبل إرسال الحمولة عبر Cloudflare AI Gateway.
ترفض Anthropic الملء المسبق للاستجابة مع التفكير الموسّع، بينما يظل
الملء المسبق العادي من دون تفكير متاحًا.

## البدء

<Steps>
  <Step title="عيّن مفتاح API للمزوّد وتفاصيل Gateway">
    شغّل الإعداد الأولي واختر خيار مصادقة Cloudflare AI Gateway:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    سيطلب ذلك معرّف الحساب ومعرّف Gateway ومفتاح API.

  </Step>
  <Step title="عيّن نموذجًا افتراضيًا">
    أضف النموذج إلى إعدادات OpenClaw لديك:

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
  <Step title="تحقق من أن النموذج متاح">
    ```bash
    openclaw models list --provider cloudflare-ai-gateway
    ```
  </Step>
</Steps>

## مثال غير تفاعلي

لإعدادات البرمجة النصية أو CI، مرّر كل القيم في سطر الأوامر:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cloudflare-ai-gateway-api-key \
  --cloudflare-ai-gateway-account-id "your-account-id" \
  --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
  --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY"
```

## الإعدادات المتقدمة

<AccordionGroup>
  <Accordion title="Gateways مصادَق عليها">
    إذا فعّلت مصادقة Gateway في Cloudflare، فأضف ترويسة `cf-aig-authorization`. هذا **إضافةً إلى** مفتاح API الخاص بالمزوّد لديك.

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
    تصادق ترويسة `cf-aig-authorization` مع Cloudflare Gateway نفسه، بينما يصادق مفتاح API الخاص بالمزوّد (على سبيل المثال، مفتاح Anthropic لديك) مع المزوّد المنبعي.
    </Tip>

  </Accordion>

  <Accordion title="ملاحظة عن البيئة">
    إذا كان Gateway يعمل كخدمة خفية (launchd/systemd)، فتأكد من أن `CLOUDFLARE_AI_GATEWAY_API_KEY` متاح لتلك العملية.

    <Warning>
    وجود المفتاح في `~/.profile` فقط لن يفيد خدمة launchd/systemd خفية ما لم تُستورد تلك البيئة هناك أيضًا. عيّن المفتاح في `~/.openclaw/.env` أو عبر `env.shellEnv` لضمان أن عملية Gateway يمكنها قراءته.
    </Warning>

  </Accordion>
</AccordionGroup>

## ذات صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    استكشاف الأخطاء وإصلاحها العام والأسئلة الشائعة.
  </Card>
</CardGroup>
