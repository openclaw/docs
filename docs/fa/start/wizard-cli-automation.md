---
read_when:
    - شما در حال خودکارسازی فرایند راه‌اندازی اولیه در اسکریپت‌ها یا CI هستید
    - برای ارائه‌دهندگان مشخص، به نمونه‌های غیرتعاملی نیاز دارید
sidebarTitle: CLI automation
summary: راه‌اندازی اولیه اسکریپت‌شده و پیکربندی عامل برای CLI ‏OpenClaw
title: خودکارسازی CLI
x-i18n:
    generated_at: "2026-07-12T10:49:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de3115fd0c675b92f22cf9c44ddd307a854e499c6f163235f991368429b2c152
    source_path: start/wizard-cli-automation.md
    workflow: 16
---

برای اسکریپت‌نویسی راه‌اندازی از `openclaw onboard --non-interactive` استفاده کنید. این دستور به `--accept-risk` نیاز دارد: راه‌اندازی غیرتعاملی می‌تواند بدون نمایش درخواست تأیید، اطلاعات ورود و پیکربندی سرویس پس‌زمینه را بنویسد؛ بنابراین این پرچم به‌منزله پذیرش صریح خطر است.

<Note>
`--json` به‌معنای فعال‌شدن حالت غیرتعاملی نیست. برای اسکریپت‌ها، `--non-interactive --accept-risk` را صراحتاً وارد کنید.
</Note>

## نمونه پایه غیرتعاملی

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --secret-input-mode plaintext \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-bootstrap \
  --skip-skills
```

برای دریافت خلاصه‌ای قابل‌خواندن توسط ماشین، `--json` را اضافه کنید.

- مقدار پیش‌فرض `--gateway-port` برابر با `18789` است؛ آن را فقط برای بازنویسی این مقدار وارد کنید.
- `--skip-bootstrap` از ایجاد فایل‌های پیش‌فرض فضای کاری صرف‌نظر می‌کند و برای خودکارسازی‌هایی مناسب است که فضای کاری خود را از قبل آماده می‌کنند.
- `--secret-input-mode ref` به‌جای کلید متنی ساده، یک ارجاع مبتنی بر متغیر محیطی (`{ source: "env", provider: "default", id: "<ENV_VAR>" }`) را در نمایه احراز هویت ذخیره می‌کند. در حالت غیرتعاملی `ref`، متغیر محیطی ارائه‌دهنده باید از قبل در محیط فرایند تنظیم شده باشد: واردکردن پرچم کلید به‌صورت درون‌خطی بدون متغیر محیطی متناظر، بلافاصله با خطا مواجه می‌شود.

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref
```

## نمونه‌های مختص ارائه‌دهندگان

<AccordionGroup>
  <Accordion title="نمونه کلید API آنتروپیک">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice apiKey \
      --anthropic-api-key "$ANTHROPIC_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="نمونه Cloudflare AI Gateway">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice cloudflare-ai-gateway-api-key \
      --cloudflare-ai-gateway-account-id "your-account-id" \
      --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
      --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="نمونه Gemini">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="نمونه Mistral">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="نمونه Moonshot">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="نمونه Ollama">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice ollama \
      --custom-model-id "qwen3.5:27b" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="نمونه OpenCode">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-bind loopback
    ```
    برای کاتالوگ Go، آن را با `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"` جایگزین کنید.
  </Accordion>
  <Accordion title="نمونه Synthetic">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="نمونه Vercel AI Gateway">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="نمونه Z.AI">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="نمونه ارائه‌دهنده سفارشی">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --custom-api-key "$CUSTOM_API_KEY" \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --custom-image-input \
      --gateway-bind loopback
    ```

    `--custom-api-key` اختیاری است؛ برخی نقاط پایانی به احراز هویت نیاز ندارند. اگر حذف شود، فرایند راه‌اندازی متغیر `CUSTOM_API_KEY` را در محیط بررسی می‌کند. `--custom-provider-id` اختیاری است و در صورت حذف، به‌طور خودکار از نشانی پایه استخراج می‌شود. مقدار پیش‌فرض `--custom-compatibility` برابر با `openai` است (مقادیر دیگر: `openai-responses` و `anthropic`).

    OpenClaw پشتیبانی از ورودی تصویر را بر اساس الگوهای شناخته‌شده شناسه مدل‌های بینایی (`gpt-4o`، `claude-3/4`، `gemini`، پسوندهای `-vl`/`vision` و موارد مشابه) تشخیص می‌دهد. برای فعال‌سازی اجباری آن در یک مدل بینایی ناشناخته، `--custom-image-input` را اضافه کنید؛ یا برای محدودکردن ورودی به متن، از `--custom-text-input` استفاده کنید.

    گونه حالت ارجاعی که `apiKey` را به‌صورت `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }` ذخیره می‌کند:

    ```bash
    export CUSTOM_API_KEY="your-key"
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --secret-input-mode ref \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --custom-image-input \
      --gateway-bind loopback
    ```

  </Accordion>
</AccordionGroup>

احراز هویت با توکن راه‌اندازی Anthropic همچنان پشتیبانی می‌شود، اما اگر ورود محلی Claude CLI در دسترس باشد، OpenClaw استفاده مجدد از Claude CLI را ترجیح می‌دهد. برای محیط عملیاتی، استفاده از کلید API آنتروپیک را ترجیح دهید.

## افزودن عامل دیگر

`openclaw agents add <name>` یک عامل جداگانه با فضای کاری، نشست‌ها و نمایه‌های احراز هویت مختص خود ایجاد می‌کند. اجرای آن بدون `--workspace` (و بدون هیچ پرچم دیگری) راهنمای تعاملی را اجرا می‌کند؛ واردکردن هرکدام از `--workspace`، `--model`، `--agent-dir`، `--bind` یا `--non-interactive` آن را به‌صورت غیرتعاملی اجرا می‌کند و در این حالت `--workspace` الزامی است.

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.6-sol \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

کلیدهای پیکربندی‌ای که می‌نویسد (ورودی `agents.list[]` برای شناسه عامل جدید):

- `name`
- `workspace`
- `agentDir`
- `model` (فقط هنگامی که `--model` وارد شده باشد)

نکته‌ها:

- فضای کاری پیش‌فرض (هنگامی که `--workspace` در راهنمای تعاملی حذف شده باشد): `~/.openclaw/workspace-<agentId>`.
- `--bind <channel[:accountId]>` قابل تکرار است؛ برای هدایت پیام‌های ورودی به عامل جدید، اتصال‌ها را اضافه کنید (این کار در راهنما نیز به‌صورت تعاملی قابل انجام است).
- نام عامل به یک شناسه عامل معتبر نرمال‌سازی می‌شود؛ `main` رزروشده است.

## مستندات مرتبط

- مرکز راه‌اندازی: [راه‌اندازی (CLI)](/fa/start/wizard)
- مرجع کامل: [مرجع راه‌اندازی CLI](/fa/start/wizard-cli-reference)
- مرجع فرمان: [`openclaw onboard`](/fa/cli/onboard)
