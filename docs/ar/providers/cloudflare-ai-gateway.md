---
read_when:
    - تريد استخدام Cloudflare AI Gateway مع OpenClaw
    - تحتاج إلى معرّف الحساب أو معرّف Gateway أو متغير بيئة مفتاح API
summary: إعداد Cloudflare AI Gateway (المصادقة + اختيار النموذج)
title: بوابة Cloudflare للذكاء الاصطناعي
x-i18n:
    generated_at: "2026-07-12T06:28:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 02c7785616e7aee645bb3fc41ef6a3585e1f2f9d886fab1a06231e497effd045
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

[Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/) تعمل أمام واجهات API الخاصة بموفّري الخدمة، وتضيف التحليلات والتخزين المؤقت وعناصر التحكم. بالنسبة إلى Anthropic، تستخدم OpenClaw واجهة Anthropic Messages API من خلال نقطة نهاية Gateway الخاصة بك.

| الخاصية       | القيمة                                                                                   |
| ------------- | ---------------------------------------------------------------------------------------- |
| موفّر الخدمة  | `cloudflare-ai-gateway`                                                                  |
| Plugin        | حزمة خارجية رسمية (`@openclaw/cloudflare-ai-gateway-provider`)                           |
| عنوان URL الأساسي | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`           |
| النموذج الافتراضي | `cloudflare-ai-gateway/claude-sonnet-4-6`                                             |
| مفتاح API     | `CLOUDFLARE_AI_GATEWAY_API_KEY` (مفتاح API لموفّر الخدمة لاستخدامه في الطلبات عبر Gateway) |

<Note>
بالنسبة إلى نماذج Anthropic الموجّهة عبر Cloudflare AI Gateway، استخدم **مفتاح Anthropic API** الخاص بك كمفتاح لموفّر الخدمة.
</Note>

عند تمكين التفكير لنماذج Anthropic Messages، تزيل OpenClaw أدوار الملء المسبق الختامية
للمساعد قبل إرسال الحمولة عبر Cloudflare AI Gateway.
ترفض Anthropic الملء المسبق للاستجابة عند استخدام التفكير الموسّع، بينما يظل
الملء المسبق العادي من دون تفكير متاحًا.

## تثبيت Plugin

ثبّت Plugin الرسمي، ثم أعد تشغيل Gateway:

```bash
openclaw plugins install @openclaw/cloudflare-ai-gateway-provider
openclaw gateway restart
```

## البدء

<Steps>
  <Step title="تعيين مفتاح API لموفّر الخدمة وتفاصيل Gateway">
    شغّل الإعداد الأولي واختر خيار مصادقة Cloudflare AI Gateway:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    يطالبك هذا بإدخال معرّف الحساب ومعرّف Gateway ومفتاح API.

  </Step>
  <Step title="تعيين نموذج افتراضي">
    أضف النموذج إلى إعدادات OpenClaw:

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
  <Step title="التحقق من توفر النموذج">
    ```bash
    openclaw models list --provider cloudflare-ai-gateway
    ```
  </Step>
</Steps>

## مثال غير تفاعلي

بالنسبة إلى عمليات الإعداد البرمجية أو إعدادات CI، مرّر جميع القيم في سطر الأوامر:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cloudflare-ai-gateway-api-key \
  --cloudflare-ai-gateway-account-id "your-account-id" \
  --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
  --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY"
```

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="بوابات Gateway المصادَق عليها">
    إذا مكّنت مصادقة Gateway في Cloudflare، فأضف ترويسة `cf-aig-authorization`. ويكون هذا **بالإضافة إلى** مفتاح API لموفّر الخدمة.

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
    تصادق ترويسة `cf-aig-authorization` مع Cloudflare Gateway نفسها، بينما يصادق مفتاح API لموفّر الخدمة (مثل مفتاح Anthropic الخاص بك) مع موفّر الخدمة في المنبع.
    </Tip>

  </Accordion>

  <Accordion title="ملاحظة حول البيئة">
    إذا كانت Gateway تعمل كخدمة خفية (launchd/systemd)، فتأكد من إتاحة `CLOUDFLARE_AI_GATEWAY_API_KEY` لتلك العملية.

    <Warning>
    لن يفيد المفتاح الذي جرى تصديره في صدفة تفاعلية فقط خدمة launchd/systemd الخفية، ما لم تُستورد تلك البيئة إليها أيضًا. عيّن المفتاح في `~/.openclaw/.env` أو عبر `env.shellEnv` لضمان تمكّن عملية Gateway من قراءته.
    </Warning>

  </Accordion>
</AccordionGroup>

## مواضيع ذات صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار موفّري الخدمة ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    استكشاف الأخطاء وإصلاحها بشكل عام والأسئلة الشائعة.
  </Card>
</CardGroup>
