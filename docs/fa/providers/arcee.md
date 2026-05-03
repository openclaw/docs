---
read_when:
    - می‌خواهید از Arcee AI با OpenClaw استفاده کنید
    - به متغیر محیطی کلید API یا گزینهٔ احراز هویت CLI نیاز دارید
summary: راه‌اندازی Arcee AI (احراز هویت + انتخاب مدل)
title: Arcee AI
x-i18n:
    generated_at: "2026-05-03T11:44:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 54989e1706901fedc8a0c816ca7ee7f877fa4b973697540dd90cb9182420043f
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) دسترسی به خانواده مدل‌های mixture-of-experts با نام Trinity را از طریق یک API سازگار با OpenAI فراهم می‌کند. همه مدل‌های Trinity تحت مجوز Apache 2.0 منتشر شده‌اند.

مدل‌های Arcee AI را می‌توان مستقیما از طریق پلتفرم Arcee یا از طریق [OpenRouter](/fa/providers/openrouter) استفاده کرد.

| ویژگی | مقدار                                                                                 |
| -------- | ------------------------------------------------------------------------------------- |
| ارائه‌دهنده | `arcee`                                                                               |
| احراز هویت     | `ARCEEAI_API_KEY` (مستقیم) یا `OPENROUTER_API_KEY` (از طریق OpenRouter)                   |
| API      | سازگار با OpenAI                                                                     |
| نشانی پایه | `https://api.arcee.ai/api/v1` (مستقیم) یا `https://openrouter.ai/api/v1` (OpenRouter) |

## شروع به کار

<Tabs>
  <Tab title="Direct (Arcee platform)">
    <Steps>
      <Step title="Get an API key">
        یک کلید API در [Arcee AI](https://chat.arcee.ai/) ایجاد کنید.
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
        یک کلید API در [OpenRouter](https://openrouter.ai/keys) ایجاد کنید.
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

        همان ارجاع‌های مدل برای راه‌اندازی مستقیم و OpenRouter کار می‌کنند (برای مثال `arcee/trinity-large-thinking`).
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

OpenClaw در حال حاضر این کاتالوگ Arcee همراه را عرضه می‌کند:

| ارجاع مدل                      | نام                   | ورودی | زمینه | هزینه (ورودی/خروجی به ازای هر ۱ میلیون) | یادداشت‌ها                                     |
| ------------------------------ | ---------------------- | ----- | ------- | -------------------- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | متن  | ۲۵۶K    | $0.25 / $0.90        | مدل پیش‌فرض؛ استدلال فعال است          |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | متن  | ۱۲۸K    | $0.25 / $1.00        | همه‌منظوره؛ ۴۰۰B پارامتر، ۱۳B فعال  |
| `arcee/trinity-mini`           | Trinity Mini 26B       | متن  | ۱۲۸K    | $0.045 / $0.15       | سریع و مقرون‌به‌صرفه؛ فراخوانی تابع |

<Tip>
پیش‌تنظیم onboarding، `arcee/trinity-large-thinking` را به‌عنوان مدل پیش‌فرض تنظیم می‌کند.
</Tip>

## ویژگی‌های پشتیبانی‌شده

| ویژگی                                       | پشتیبانی                    |
| --------------------------------------------- | ---------------------------- |
| استریم‌کردن                                     | بله                          |
| استفاده از ابزار / فراخوانی تابع                   | بله                          |
| خروجی ساختاریافته (حالت JSON و شِمای JSON) | بله                          |
| تفکر گسترده                             | بله (Trinity Large Thinking) |

<AccordionGroup>
  <Accordion title="Environment note">
    اگر Gateway به‌صورت daemon (launchd/systemd) اجرا می‌شود، مطمئن شوید `ARCEEAI_API_KEY`
    (یا `OPENROUTER_API_KEY`) برای آن فرایند در دسترس است (برای مثال، در
    `~/.openclaw/.env` یا از طریق `env.shellEnv`).
  </Accordion>

  <Accordion title="OpenRouter routing">
    هنگام استفاده از مدل‌های Arcee از طریق OpenRouter، همان ارجاع‌های مدل `arcee/*` اعمال می‌شوند.
    OpenClaw مسیریابی را بر اساس انتخاب احراز هویت شما به‌صورت شفاف انجام می‌دهد. برای جزئیات پیکربندی
    ویژه OpenRouter، [مستندات ارائه‌دهنده OpenRouter](/fa/providers/openrouter) را ببینید.
  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/fa/providers/openrouter" icon="shuffle">
    با یک کلید API واحد به مدل‌های Arcee و بسیاری مدل‌های دیگر دسترسی پیدا کنید.
  </Card>
  <Card title="Model selection" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل، و رفتار failover.
  </Card>
</CardGroup>
