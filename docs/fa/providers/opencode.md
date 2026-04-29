---
read_when:
    - شما دسترسی به مدل‌های میزبانی‌شده توسط OpenCode را می‌خواهید
    - می‌خواهید بین کاتالوگ‌های Zen و Go یکی را انتخاب کنید
summary: استفاده از کاتالوگ‌های OpenCode Zen و Go با OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-04-29T23:27:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: cb0521b038e519f139c66f98ddef4919d8c43ce64018ef8af8f7b42ac00114a4
    source_path: providers/opencode.md
    workflow: 16
---

OpenCode دو کاتالوگ میزبانی‌شده را در OpenClaw ارائه می‌کند:

| کاتالوگ | پیشوند            | ارائه‌دهنده زمان اجرا |
| ------- | ----------------- | ---------------- |
| **Zen** | `opencode/...`    | `opencode`       |
| **Go**  | `opencode-go/...` | `opencode-go`    |

هر دو کاتالوگ از یک کلید API یکسان OpenCode استفاده می‌کنند. OpenClaw شناسه‌های ارائه‌دهنده زمان اجرا را جدا نگه می‌دارد تا مسیریابی بالادستی برای هر مدل درست باقی بماند، اما راه‌اندازی اولیه و مستندات آن‌ها را به‌عنوان یک راه‌اندازی OpenCode واحد در نظر می‌گیرند.

## شروع به کار

<Tabs>
  <Tab title="Zen catalog">
    **بهترین برای:** پراکسی چندمدلی گزینش‌شده OpenCode (Claude، GPT، Gemini).

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        یا کلید را مستقیماً وارد کنید:

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Set a Zen model as the default">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Go catalog">
    **بهترین برای:** مجموعه Kimi، GLM و MiniMax میزبانی‌شده در OpenCode.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        یا کلید را مستقیماً وارد کنید:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Set a Go model as the default">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## نمونه پیکربندی

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## کاتالوگ‌های داخلی

### Zen

| ویژگی         | مقدار                                                                   |
| ---------------- | ----------------------------------------------------------------------- |
| ارائه‌دهنده زمان اجرا | `opencode`                                                              |
| مدل‌های نمونه   | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3-pro` |

### Go

| ویژگی         | مقدار                                                                    |
| ---------------- | ------------------------------------------------------------------------ |
| ارائه‌دهنده زمان اجرا | `opencode-go`                                                            |
| مدل‌های نمونه   | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="API key aliases">
    `OPENCODE_ZEN_API_KEY` نیز به‌عنوان نام مستعار برای `OPENCODE_API_KEY` پشتیبانی می‌شود.
  </Accordion>

  <Accordion title="Shared credentials">
    وارد کردن یک کلید OpenCode در زمان راه‌اندازی، اعتبارنامه‌ها را برای هر دو ارائه‌دهنده زمان اجرا ذخیره می‌کند. لازم نیست هر کاتالوگ را جداگانه راه‌اندازی کنید.
  </Accordion>

  <Accordion title="Billing and dashboard">
    وارد OpenCode می‌شوید، جزئیات صورت‌حساب را اضافه می‌کنید و کلید API خود را کپی می‌کنید. صورت‌حساب و دسترس‌پذیری کاتالوگ از داشبورد OpenCode مدیریت می‌شوند.
  </Accordion>

  <Accordion title="Gemini replay behavior">
    ارجاع‌های OpenCode مبتنی بر Gemini روی مسیر proxy-Gemini باقی می‌مانند، بنابراین OpenClaw پاک‌سازی امضای فکری Gemini را در همان‌جا نگه می‌دارد، بدون اینکه اعتبارسنجی بازپخش بومی Gemini یا بازنویسی‌های راه‌انداز را فعال کند.
  </Accordion>

  <Accordion title="Non-Gemini replay behavior">
    ارجاع‌های OpenCode غیر Gemini سیاست بازپخش حداقلی سازگار با OpenAI را حفظ می‌کنند.
  </Accordion>
</AccordionGroup>

<Tip>
وارد کردن یک کلید OpenCode در زمان راه‌اندازی، اعتبارنامه‌ها را برای هر دو ارائه‌دهنده زمان اجرای Zen و Go ذخیره می‌کند، بنابراین فقط یک‌بار به راه‌اندازی اولیه نیاز دارید.
</Tip>

## مرتبط

<CardGroup cols={2}>
  <Card title="Model selection" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل و رفتار جایگزینی.
  </Card>
  <Card title="Configuration reference" href="/fa/gateway/configuration-reference" icon="gear">
    مرجع کامل پیکربندی برای عامل‌ها، مدل‌ها و ارائه‌دهندگان.
  </Card>
</CardGroup>
