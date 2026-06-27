---
read_when:
    - می‌خواهید از Vercel AI Gateway با OpenClaw استفاده کنید
    - به متغیر محیطی کلید API یا گزینه احراز هویت CLI نیاز دارید
summary: راه‌اندازی Vercel AI Gateway (احراز هویت + انتخاب مدل)
title: Gateway هوش مصنوعی Vercel
x-i18n:
    generated_at: "2026-06-27T18:45:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 27aeeeff28661839f3be55c60bf1b383b95af78e17abb77441ae4e81f58688ed
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

[Vercel AI Gateway](https://vercel.com/ai-gateway) یک API یکپارچه برای
دسترسی به صدها مدل از طریق یک endpoint واحد فراهم می‌کند.

| ویژگی        | مقدار                                  |
| ------------- | -------------------------------------- |
| ارائه‌دهنده   | `vercel-ai-gateway`                    |
| بسته          | `@openclaw/vercel-ai-gateway-provider` |
| احراز هویت    | `AI_GATEWAY_API_KEY`                   |
| API           | سازگار با Anthropic Messages           |
| کاتالوگ مدل   | کشف خودکار از طریق `/v1/models`        |

<Tip>
OpenClaw کاتالوگ `/v1/models` مربوط به Gateway را به‌صورت خودکار کشف می‌کند، بنابراین
`/models vercel-ai-gateway` شامل ارجاع‌های مدل فعلی مانند
`vercel-ai-gateway/openai/gpt-5.5` و
`vercel-ai-gateway/moonshotai/kimi-k2.6` است.
</Tip>

## شروع کار

<Steps>
  <Step title="نصب Plugin">
    ```bash
    openclaw plugins install @openclaw/vercel-ai-gateway-provider
    ```
  </Step>
  <Step title="تنظیم کلید API">
    onboarding را اجرا کنید و گزینه احراز هویت AI Gateway را انتخاب کنید:

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="تنظیم مدل پیش‌فرض">
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
  <Step title="بررسی در دسترس بودن مدل">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## نمونه غیرتعاملی

برای راه‌اندازی‌های اسکریپتی یا CI، همه مقدارها را در خط فرمان پاس بدهید:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## شکل کوتاه شناسه مدل

OpenClaw ارجاع‌های مدل کوتاه‌نویسی‌شده Vercel Claude را می‌پذیرد و آن‌ها را در
زمان اجرا نرمال‌سازی می‌کند:

| ورودی کوتاه‌نویسی‌شده               | ارجاع مدل نرمال‌شده                         |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
می‌توانید در پیکربندی خود از کوتاه‌نویسی یا ارجاع مدل کاملا واجد شرایط استفاده کنید.
OpenClaw فرم canonical را به‌صورت خودکار resolve می‌کند.
</Tip>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="متغیر محیطی برای فرایندهای daemon">
    اگر OpenClaw Gateway به‌صورت daemon اجرا می‌شود (launchd/systemd)، مطمئن شوید
    `AI_GATEWAY_API_KEY` برای آن فرایند در دسترس است.

    <Warning>
    کلیدی که فقط در یک پوسته تعاملی export شده باشد، برای daemon مربوط به
    launchd/systemd قابل مشاهده نخواهد بود، مگر اینکه آن محیط به‌صورت صریح import شده باشد.
    کلید را در `~/.openclaw/.env` یا از طریق `env.shellEnv` تنظیم کنید تا مطمئن شوید
    فرایند gateway می‌تواند آن را بخواند.
    </Warning>

  </Accordion>

  <Accordion title="مسیریابی ارائه‌دهنده">
    Vercel AI Gateway درخواست‌ها را بر اساس پیشوند ارجاع مدل به ارائه‌دهنده upstream
    مسیریابی می‌کند. برای مثال، `vercel-ai-gateway/anthropic/claude-opus-4.6` از طریق
    Anthropic مسیریابی می‌شود، در حالی که `vercel-ai-gateway/openai/gpt-5.5` از طریق
    OpenAI و `vercel-ai-gateway/moonshotai/kimi-k2.6` از طریق
    MoonshotAI مسیریابی می‌شود. تنها `AI_GATEWAY_API_KEY` شما احراز هویت را برای همه
    ارائه‌دهندگان upstream انجام می‌دهد.
  </Accordion>
  <Accordion title="سطوح تفکر">
    گزینه‌های `/think` زمانی که OpenClaw قرارداد ارائه‌دهنده upstream را می‌شناسد،
    از پیشوندهای مدل upstream مورد اعتماد پیروی می‌کنند. `vercel-ai-gateway/anthropic/...` از
    پروفایل تفکر Claude استفاده می‌کند، از جمله پیش‌فرض‌های تطبیقی برای مدل‌های Claude 4.6.
    `vercel-ai-gateway/openai/gpt-5.4`، `gpt-5.5`، و ارجاع‌های سبک Codex
    `/think xhigh` را درست مانند ارائه‌دهندگان مستقیم OpenAI/OpenAI Codex ارائه می‌کنند.
    سایر ارجاع‌های namespaced سطح‌های معمول استدلال را نگه می‌دارند، مگر اینکه فراداده
    کاتالوگ آن‌ها موارد بیشتری را اعلام کند.
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
