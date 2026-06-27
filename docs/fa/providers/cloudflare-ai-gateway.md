---
read_when:
    - می‌خواهید از Cloudflare AI Gateway با OpenClaw استفاده کنید
    - به شناسه حساب، شناسه Gateway، یا متغیر محیطی کلید API نیاز دارید
summary: راه‌اندازی Cloudflare AI Gateway (احراز هویت + انتخاب مدل)
title: Gateway هوش مصنوعی Cloudflare
x-i18n:
    generated_at: "2026-06-27T18:38:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05678faa049349c610a9c7ea9d23958bf51927453cf6987fef397cd273f6556b
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

Cloudflare AI Gateway جلوی APIهای ارائه‌دهنده قرار می‌گیرد و به شما امکان می‌دهد تحلیل‌، کش‌کردن، و کنترل‌ها را اضافه کنید. برای Anthropic، OpenClaw از Anthropic Messages API از طریق نقطه پایانی Gateway شما استفاده می‌کند.

| ویژگی       | مقدار                                                                                   |
| ------------- | ---------------------------------------------------------------------------------------- |
| ارائه‌دهنده  | `cloudflare-ai-gateway`                                                                  |
| URL پایه      | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| مدل پیش‌فرض   | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                |
| کلید API      | `CLOUDFLARE_AI_GATEWAY_API_KEY` (کلید API ارائه‌دهنده شما برای درخواست‌ها از طریق Gateway) |

<Note>
برای مدل‌های Anthropic که از طریق Cloudflare AI Gateway مسیریابی می‌شوند، از **کلید API Anthropic** خود به‌عنوان کلید ارائه‌دهنده استفاده کنید.
</Note>

وقتی thinking برای مدل‌های Anthropic Messages فعال باشد، OpenClaw نوبت‌های prefill پایانی
دستیار را پیش از ارسال payload از طریق Cloudflare AI Gateway حذف می‌کند.
Anthropic، پیش‌پرکردن پاسخ را با extended thinking رد می‌کند، در حالی که prefill معمولی
بدون thinking همچنان در دسترس است.

## نصب Plugin

Plugin رسمی را نصب کنید، سپس Gateway را راه‌اندازی مجدد کنید:

```bash
openclaw plugins install @openclaw/cloudflare-ai-gateway-provider
openclaw gateway restart
```

## شروع به کار

<Steps>
  <Step title="تنظیم کلید API ارائه‌دهنده و جزئیات Gateway">
    onboarding را اجرا کنید و گزینه احراز هویت Cloudflare AI Gateway را انتخاب کنید:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    این کار شناسه حساب، شناسه gateway، و کلید API شما را درخواست می‌کند.

  </Step>
  <Step title="تنظیم مدل پیش‌فرض">
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
  <Accordion title="gatewayهای احراز هویت‌شده">
    اگر احراز هویت Gateway را در Cloudflare فعال کرده‌اید، سربرگ `cf-aig-authorization` را اضافه کنید. این **علاوه بر** کلید API ارائه‌دهنده شماست.

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
    سربرگ `cf-aig-authorization` با خود Cloudflare Gateway احراز هویت می‌کند، در حالی که کلید API ارائه‌دهنده (برای مثال، کلید Anthropic شما) با ارائه‌دهنده بالادستی احراز هویت می‌کند.
    </Tip>

  </Accordion>

  <Accordion title="نکته محیطی">
    اگر Gateway به‌صورت daemon (launchd/systemd) اجرا می‌شود، مطمئن شوید `CLOUDFLARE_AI_GATEWAY_API_KEY` برای آن فرایند در دسترس است.

    <Warning>
    کلیدی که فقط در یک پوسته تعاملی export شده باشد، به daemon مربوط به launchd/systemd کمکی نمی‌کند مگر اینکه آن محیط در آنجا نیز import شده باشد. کلید را در `~/.openclaw/.env` یا از طریق `env.shellEnv` تنظیم کنید تا مطمئن شوید فرایند gateway می‌تواند آن را بخواند.
    </Warning>

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل، و رفتار failover.
  </Card>
  <Card title="عیب‌یابی" href="/fa/help/troubleshooting" icon="wrench">
    عیب‌یابی عمومی و پرسش‌های متداول.
  </Card>
</CardGroup>
