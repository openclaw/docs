---
read_when:
    - می‌خواهید از Cloudflare AI Gateway با OpenClaw استفاده کنید
    - به شناسه حساب، شناسه Gateway یا متغیر محیطی کلید API نیاز دارید.
summary: راه‌اندازی Cloudflare AI Gateway (احراز هویت + انتخاب مدل)
title: Gateway هوش مصنوعی Cloudflare
x-i18n:
    generated_at: "2026-04-29T23:24:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7c567076a5b3fea0f09f44d772c0858aed2a4813f91f1cc9f87b0da39c2e5db
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

Cloudflare AI Gateway در برابر APIهای ارائه‌دهنده قرار می‌گیرد و به شما امکان می‌دهد تحلیل، کش و کنترل‌ها را اضافه کنید. برای Anthropic، OpenClaw از Anthropic Messages API از طریق نقطه پایانی Gateway شما استفاده می‌کند.

| ویژگی        | مقدار                                                                                   |
| ------------- | ---------------------------------------------------------------------------------------- |
| ارائه‌دهنده  | `cloudflare-ai-gateway`                                                                  |
| URL پایه      | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| مدل پیش‌فرض  | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                |
| کلید API     | `CLOUDFLARE_AI_GATEWAY_API_KEY` (کلید API ارائه‌دهنده شما برای درخواست‌ها از طریق Gateway) |

<Note>
برای مدل‌های Anthropic که از طریق Cloudflare AI Gateway مسیریابی می‌شوند، از **کلید API Anthropic** خود به‌عنوان کلید ارائه‌دهنده استفاده کنید.
</Note>

وقتی thinking برای مدل‌های Anthropic Messages فعال باشد، OpenClaw نوبت‌های
assistant prefill انتهایی را پیش از ارسال payload از طریق Cloudflare AI Gateway حذف می‌کند.
Anthropic پاسخ‌های ازپیش‌پرشده را با extended thinking رد می‌کند، در حالی که prefill عادی
بدون thinking همچنان در دسترس می‌ماند.

## شروع به کار

<Steps>
  <Step title="تنظیم کلید API ارائه‌دهنده و جزئیات Gateway">
    onboarding را اجرا کنید و گزینه احراز هویت Cloudflare AI Gateway را انتخاب کنید:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    این کار شناسه حساب، شناسه Gateway و کلید API شما را درخواست می‌کند.

  </Step>
  <Step title="تنظیم یک مدل پیش‌فرض">
    مدل را به پیکربندی OpenClaw خود اضافه کنید:

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
  <Step title="تأیید در دسترس بودن مدل">
    ```bash
    openclaw models list --provider cloudflare-ai-gateway
    ```
  </Step>
</Steps>

## نمونه غیرتعاملی

برای راه‌اندازی‌های اسکریپتی یا CI، همه مقادیر را در خط فرمان وارد کنید:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cloudflare-ai-gateway-api-key \
  --cloudflare-ai-gateway-account-id "your-account-id" \
  --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
  --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY"
```

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="Gatewayهای احراز هویت‌شده">
    اگر احراز هویت Gateway را در Cloudflare فعال کرده‌اید، سرآیند `cf-aig-authorization` را اضافه کنید. این مورد **علاوه بر** کلید API ارائه‌دهنده شما است.

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
    سرآیند `cf-aig-authorization` با خود Cloudflare Gateway احراز هویت می‌کند، در حالی که کلید API ارائه‌دهنده (برای مثال، کلید Anthropic شما) با ارائه‌دهنده بالادست احراز هویت می‌کند.
    </Tip>

  </Accordion>

  <Accordion title="یادداشت محیط">
    اگر Gateway به‌صورت daemon (launchd/systemd) اجرا می‌شود، مطمئن شوید `CLOUDFLARE_AI_GATEWAY_API_KEY` برای آن فرایند در دسترس است.

    <Warning>
    کلیدی که فقط در `~/.profile` قرار دارد به daemon مربوط به launchd/systemd کمکی نمی‌کند، مگر اینکه آن محیط نیز در آنجا وارد شده باشد. کلید را در `~/.openclaw/.env` یا از طریق `env.shellEnv` تنظیم کنید تا مطمئن شوید فرایند Gateway می‌تواند آن را بخواند.
    </Warning>

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهنده‌ها، ارجاع‌های مدل و رفتار failover.
  </Card>
  <Card title="عیب‌یابی" href="/fa/help/troubleshooting" icon="wrench">
    عیب‌یابی عمومی و پرسش‌های متداول.
  </Card>
</CardGroup>
