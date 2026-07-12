---
read_when:
    - می‌خواهید از Vercel AI Gateway با OpenClaw استفاده کنید
    - به متغیر محیطی کلید API یا گزینه احراز هویت CLI نیاز دارید
summary: راه‌اندازی Vercel AI Gateway (احراز هویت + انتخاب مدل)
title: Gateway هوش مصنوعی Vercel
x-i18n:
    generated_at: "2026-07-12T10:42:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c1e4776604491900a914e75caebfd7e27a81e9f859213f5bd5b25582a923d92a
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

[Vercel AI Gateway](https://vercel.com/ai-gateway) یک API یکپارچه برای دسترسی به
صدها مدل از طریق یک نقطه پایانی واحد فراهم می‌کند.

| ویژگی         | مقدار                                  |
| ------------- | -------------------------------------- |
| ارائه‌دهنده   | `vercel-ai-gateway`                    |
| بسته          | `@openclaw/vercel-ai-gateway-provider` |
| احراز هویت    | `AI_GATEWAY_API_KEY`                   |
| API           | سازگار با Anthropic Messages           |
| نشانی پایه    | `https://ai-gateway.vercel.sh`         |
| فهرست مدل‌ها  | کشف خودکار از طریق `/v1/models`        |

<Tip>
OpenClaw فهرست `/v1/models` متعلق به Gateway را به‌طور خودکار کشف می‌کند؛ بنابراین هم
فرمان گفت‌وگوی `‎/models vercel-ai-gateway` و هم
`openclaw models list --provider vercel-ai-gateway` شامل ارجاع‌های فعلی مدل
مانند `vercel-ai-gateway/openai/gpt-5.5` و
`vercel-ai-gateway/moonshotai/kimi-k2.6` هستند.
</Tip>

## شروع به کار

<Steps>
  <Step title="Plugin را نصب کنید">
    ```bash
    openclaw plugins install @openclaw/vercel-ai-gateway-provider
    ```
  </Step>
  <Step title="کلید API را تنظیم کنید">
    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```
  </Step>
  <Step title="یک مدل پیش‌فرض تنظیم کنید">
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
  <Step title="در دسترس بودن مدل را بررسی کنید">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## نمونه غیرتعاملی

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## شکل کوتاه شناسه مدل

OpenClaw ارجاع‌های کوتاه مدل Claude را هنگام اجرا به شکل استاندارد تبدیل می‌کند:

| ورودی کوتاه                         | ارجاع استانداردشده مدل                         |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
در پیکربندی خود می‌توانید از هر یک از این دو شکل استفاده کنید؛ OpenClaw ارجاع
استاندارد `anthropic/...` را به‌طور خودکار شناسایی می‌کند.
</Tip>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="متغیر محیطی برای فرایندهای سرویس پس‌زمینه">
    اگر Gateway متعلق به OpenClaw به‌صورت سرویس پس‌زمینه (launchd/systemd) اجرا می‌شود، مطمئن شوید
    `AI_GATEWAY_API_KEY` برای آن فرایند در دسترس است.

    <Warning>
    کلیدی که فقط در یک پوسته تعاملی صادر شده باشد، برای سرویس پس‌زمینه
    launchd/systemd قابل مشاهده نخواهد بود، مگر اینکه آن محیط صراحتاً وارد شود. برای اطمینان از اینکه
    فرایند Gateway می‌تواند کلید را بخواند، آن را در `~/.openclaw/.env` یا از طریق `env.shellEnv`
    تنظیم کنید.
    </Warning>

  </Accordion>

  <Accordion title="مسیریابی ارائه‌دهنده">
    Vercel AI Gateway هر درخواست را به ارائه‌دهنده بالادستیِ مشخص‌شده در پیشوند
    ارجاع مدل هدایت می‌کند. برای نمونه، `vercel-ai-gateway/anthropic/claude-opus-4.6`
    از طریق Anthropic، ‏`vercel-ai-gateway/openai/gpt-5.5` از طریق
    OpenAI و `vercel-ai-gateway/moonshotai/kimi-k2.6` از طریق
    MoonshotAI مسیریابی می‌شود. یک `AI_GATEWAY_API_KEY` همه ارائه‌دهندگان بالادستی را احراز هویت می‌کند.
  </Accordion>
  <Accordion title="سطوح تفکر">
    هنگامی که OpenClaw پیشوند مدل بالادستی را تشخیص دهد، گزینه‌های `/think` از آن
    پیروی می‌کنند. `vercel-ai-gateway/anthropic/...` از نمایه تفکر Claude استفاده می‌کند،
    از جمله پیش‌فرض تطبیقی برای مدل‌های Claude 4.6. ارجاع‌های مورداعتماد
    `vercel-ai-gateway/openai/...` (نسخه `gpt-5.2` و جدیدتر، به‌علاوه گونه‌های Codex
    تا `gpt-5.1-codex`) گزینه `/think xhigh` را ارائه می‌کنند. سایر ارجاع‌های
    دارای فضای نام، سطوح استاندارد استدلال را حفظ می‌کنند، مگر اینکه فراداده فهرست آن‌ها
    سطوح بیشتری را اعلام کند.
  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل و رفتار جایگزینی هنگام خرابی.
  </Card>
  <Card title="عیب‌یابی" href="/fa/help/troubleshooting" icon="wrench">
    عیب‌یابی عمومی و پرسش‌های متداول.
  </Card>
</CardGroup>
