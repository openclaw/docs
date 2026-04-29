---
read_when:
    - می‌خواهید از Vercel AI Gateway با OpenClaw استفاده کنید
    - به متغیر محیطی کلید API یا گزینهٔ احراز هویت CLI نیاز دارید
summary: راه‌اندازی Vercel AI Gateway (احراز هویت + انتخاب مدل)
title: Gateway هوش مصنوعی Vercel
x-i18n:
    generated_at: "2026-04-29T23:30:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3bbe498a04c2073020fcfbbe68cb506eca4c52c3274e4eca6ab7e6893fcfa56
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

[Vercel AI Gateway](https://vercel.com/ai-gateway) یک API یکپارچه فراهم می‌کند تا از طریق یک endpoint واحد به صدها مدل دسترسی داشته باشید.

| ویژگی        | مقدار                           |
| ------------- | -------------------------------- |
| ارائه‌دهنده  | `vercel-ai-gateway`              |
| احراز هویت   | `AI_GATEWAY_API_KEY`             |
| API           | سازگار با Anthropic Messages     |
| کاتالوگ مدل  | کشف خودکار از طریق `/v1/models` |

<Tip>
OpenClaw کاتالوگ Gateway `/v1/models` را به‌صورت خودکار کشف می‌کند، بنابراین
`/models vercel-ai-gateway` شامل ارجاع‌های فعلی مدل مانند
`vercel-ai-gateway/openai/gpt-5.5` و
`vercel-ai-gateway/moonshotai/kimi-k2.6` است.
</Tip>

## شروع به کار

<Steps>
  <Step title="Set the API key">
    فرایند onboarding را اجرا کنید و گزینه احراز هویت AI Gateway را انتخاب کنید:

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="Set a default model">
    مدل را به پیکربندی OpenClaw خود اضافه کنید:

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

## نمونه غیرتعاملی

برای راه‌اندازی‌های اسکریپتی یا CI، همه مقادیر را در خط فرمان وارد کنید:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## شکل کوتاه ID مدل

OpenClaw ارجاع‌های کوتاه مدل Vercel Claude را می‌پذیرد و هنگام اجرا آن‌ها را عادی‌سازی می‌کند:

| ورودی کوتاه                           | ارجاع مدل عادی‌سازی‌شده                     |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
می‌توانید در پیکربندی خود از شکل کوتاه یا ارجاع مدل کاملا واجد شرایط استفاده کنید. OpenClaw شکل canonical را به‌صورت خودکار تشخیص می‌دهد.
</Tip>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="Environment variable for daemon processes">
    اگر OpenClaw Gateway به‌صورت daemon اجرا می‌شود (launchd/systemd)، مطمئن شوید
    `AI_GATEWAY_API_KEY` برای آن فرایند در دسترس است.

    <Warning>
    کلیدی که فقط در `~/.profile` تنظیم شده باشد برای یک daemon مربوط به launchd/systemd قابل مشاهده نخواهد بود، مگر اینکه آن محیط صراحتا import شده باشد. کلید را در
    `~/.openclaw/.env` یا از طریق `env.shellEnv` تنظیم کنید تا مطمئن شوید فرایند Gateway می‌تواند آن را بخواند.
    </Warning>

  </Accordion>

  <Accordion title="Provider routing">
    Vercel AI Gateway درخواست‌ها را بر اساس پیشوند ارجاع مدل به ارائه‌دهنده بالادستی مسیریابی می‌کند. برای مثال، `vercel-ai-gateway/anthropic/claude-opus-4.6` از طریق Anthropic مسیریابی می‌شود، در حالی که `vercel-ai-gateway/openai/gpt-5.5` از طریق OpenAI و `vercel-ai-gateway/moonshotai/kimi-k2.6` از طریق MoonshotAI مسیریابی می‌شود. تنها `AI_GATEWAY_API_KEY` شما احراز هویت همه ارائه‌دهندگان بالادستی را مدیریت می‌کند.
  </Accordion>
  <Accordion title="Thinking levels">
    گزینه‌های `/think` زمانی که OpenClaw قرارداد ارائه‌دهنده بالادستی را می‌شناسد، از پیشوندهای مدل بالادستی مورد اعتماد پیروی می‌کنند. `vercel-ai-gateway/anthropic/...` از پروفایل تفکر Claude استفاده می‌کند، از جمله پیش‌فرض‌های تطبیقی برای مدل‌های Claude 4.6.
    `vercel-ai-gateway/openai/gpt-5.4`، `gpt-5.5`، و ارجاع‌های سبک Codex،
    `/think xhigh` را درست مانند ارائه‌دهندگان مستقیم OpenAI/OpenAI Codex ارائه می‌کنند. سایر ارجاع‌های namespaced سطح‌های عادی reasoning را حفظ می‌کنند، مگر اینکه metadata کاتالوگ آن‌ها موارد بیشتری اعلام کند.
  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="Model selection" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل، و رفتار failover.
  </Card>
  <Card title="Troubleshooting" href="/fa/help/troubleshooting" icon="wrench">
    عیب‌یابی عمومی و پرسش‌های متداول.
  </Card>
</CardGroup>
