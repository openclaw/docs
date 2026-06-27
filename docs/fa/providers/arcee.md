---
read_when:
    - می‌خواهید از Arcee AI با OpenClaw استفاده کنید
    - به متغیر محیطی کلید API یا گزینهٔ احراز هویت CLI نیاز دارید
summary: راه‌اندازی Arcee AI (احراز هویت + انتخاب مدل)
title: Arcee AI
x-i18n:
    generated_at: "2026-06-27T18:36:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15570c1d018104377a473fe5f9b556d9a6ffd2dea6db5d55d46ca3702e237101
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) از طریق یک API سازگار با OpenAI، دسترسی به خانواده مدل‌های mixture-of-experts مدل‌های Trinity را فراهم می‌کند. همه مدل‌های Trinity تحت مجوز Apache 2.0 هستند.

مدل‌های Arcee AI را می‌توان مستقیم از طریق پلتفرم Arcee یا از طریق [OpenRouter](/fa/providers/openrouter) در دسترس داشت.

| ویژگی | مقدار                                                                                |
| -------- | ------------------------------------------------------------------------------------- |
| ارائه‌دهنده | `arcee`                                                                               |
| احراز هویت     | `ARCEEAI_API_KEY` (مستقیم) یا `OPENROUTER_API_KEY` (از طریق OpenRouter)                   |
| API      | سازگار با OpenAI                                                                     |
| URL پایه | `https://api.arcee.ai/api/v1` (مستقیم) یا `https://openrouter.ai/api/v1` (OpenRouter) |

## نصب Plugin

Plugin رسمی را نصب کنید، سپس Gateway را راه‌اندازی مجدد کنید:

```bash
openclaw plugins install @openclaw/arcee-provider
openclaw gateway restart
```

## شروع به کار

<Tabs>
  <Tab title="Direct (Arcee platform)">
    <Steps>
      <Step title="Get an API key">
        در [Arcee AI](https://chat.arcee.ai/) یک کلید API ایجاد کنید.
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Via OpenRouter">
    <Steps>
      <Step title="Get an API key">
        در [OpenRouter](https://openrouter.ai/keys) یک کلید API ایجاد کنید.
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```

        همان ارجاع‌های مدل برای راه‌اندازی مستقیم و راه‌اندازی OpenRouter کار می‌کنند (برای مثال `arcee/trinity-large-thinking`).
      </Step>
    </Steps>

  </Tab>
</Tabs>

## راه‌اندازی غیرتعاملی

<Tabs>
  <Tab title="Direct (Arcee platform)">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-api-key \
      --arceeai-api-key "$ARCEEAI_API_KEY"
    ```
  </Tab>

  <Tab title="Via OpenRouter">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-openrouter \
      --openrouter-api-key "$OPENROUTER_API_KEY"
    ```
  </Tab>
</Tabs>

## کاتالوگ داخلی

OpenClaw در حال حاضر این کاتالوگ ایستای Arcee را عرضه می‌کند:

| ارجاع مدل                      | نام                   | ورودی | زمینه | هزینه (ورودی/خروجی به‌ازای ۱ میلیون) | یادداشت‌ها                                     |
| ------------------------------ | ---------------------- | ----- | ------- | -------------------- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | متن  | 256K    | $0.25 / $0.90        | مدل پیش‌فرض؛ استدلال فعال است          |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | متن  | 128K    | $0.25 / $1.00        | همه‌منظوره؛ 400B پارامتر، 13B فعال  |
| `arcee/trinity-mini`           | Trinity Mini 26B       | متن  | 128K    | $0.045 / $0.15       | سریع و مقرون‌به‌صرفه؛ فراخوانی تابع |

<Tip>
پیش‌تنظیم onboarding، `arcee/trinity-large-thinking` را به‌عنوان مدل پیش‌فرض تنظیم می‌کند.
</Tip>

## قابلیت‌های پشتیبانی‌شده

| قابلیت                                       | پشتیبانی‌شده                                    |
| --------------------------------------------- | -------------------------------------------- |
| Streaming                                     | بله                                          |
| استفاده از ابزار / فراخوانی تابع                   | بله (Trinity Mini، Trinity Large Preview)    |
| خروجی ساختاریافته (حالت JSON و شِمای JSON) | بله                                          |
| تفکر توسعه‌یافته                             | بله (Trinity Large Thinking؛ ابزارها غیرفعال هستند) |

<AccordionGroup>
  <Accordion title="Environment note">
    اگر Gateway به‌صورت daemon (launchd/systemd) اجرا می‌شود، مطمئن شوید `ARCEEAI_API_KEY`
    (یا `OPENROUTER_API_KEY`) برای آن فرایند در دسترس است (برای مثال، در
    `~/.openclaw/.env` یا از طریق `env.shellEnv`).
  </Accordion>

  <Accordion title="OpenRouter routing">
    هنگام استفاده از مدل‌های Arcee از طریق OpenRouter، همان ارجاع‌های مدل `arcee/*` اعمال می‌شوند.
    OpenClaw بر اساس انتخاب احراز هویت شما، مسیریابی را به‌صورت شفاف انجام می‌دهد. برای جزئیات
    پیکربندی مخصوص OpenRouter، [مستندات ارائه‌دهنده OpenRouter](/fa/providers/openrouter) را ببینید.
  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/fa/providers/openrouter" icon="shuffle">
    به مدل‌های Arcee و بسیاری مدل‌های دیگر از طریق یک کلید API واحد دسترسی پیدا کنید.
  </Card>
  <Card title="Model selection" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل، و رفتار failover.
  </Card>
</CardGroup>
