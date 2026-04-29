---
read_when:
    - می‌خواهید از Arcee AI با OpenClaw استفاده کنید
    - به متغیر محیطی کلید API یا گزینه احراز هویت CLI نیاز دارید
summary: راه‌اندازی Arcee AI (احراز هویت + انتخاب مدل)
title: Arcee AI
x-i18n:
    generated_at: "2026-04-29T23:22:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 54989e1706901fedc8a0c816ca7ee7f877fa4b973697540dd90cb9182420043f
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) دسترسی به خانواده Trinity از مدل‌های mixture-of-experts را از طریق یک API سازگار با OpenAI فراهم می‌کند. همه مدل‌های Trinity تحت مجوز Apache 2.0 منتشر شده‌اند.

مدل‌های Arcee AI را می‌توان مستقیما از طریق پلتفرم Arcee یا از طریق [OpenRouter](/fa/providers/openrouter) در دسترس داشت.

| ویژگی | مقدار                                                                                 |
| -------- | ------------------------------------------------------------------------------------- |
| ارائه‌دهنده | `arcee`                                                                               |
| احراز هویت     | `ARCEEAI_API_KEY` (مستقیم) یا `OPENROUTER_API_KEY` (از طریق OpenRouter)                   |
| API      | سازگار با OpenAI                                                                     |
| URL پایه | `https://api.arcee.ai/api/v1` (مستقیم) یا `https://openrouter.ai/api/v1` (OpenRouter) |

## شروع به کار

<Tabs>
  <Tab title="مستقیم (پلتفرم Arcee)">
    <Steps>
      <Step title="دریافت کلید API">
        در [Arcee AI](https://chat.arcee.ai/) یک کلید API بسازید.
      </Step>
      <Step title="اجرای راه‌اندازی اولیه">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="تنظیم مدل پیش‌فرض">
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

  <Tab title="از طریق OpenRouter">
    <Steps>
      <Step title="دریافت کلید API">
        در [OpenRouter](https://openrouter.ai/keys) یک کلید API بسازید.
      </Step>
      <Step title="اجرای راه‌اندازی اولیه">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="تنظیم مدل پیش‌فرض">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```

        همان ارجاع‌های مدل برای هر دو پیکربندی مستقیم و OpenRouter کار می‌کنند (برای مثال `arcee/trinity-large-thinking`).
      </Step>
    </Steps>

  </Tab>
</Tabs>

## راه‌اندازی غیرتعاملی

<Tabs>
  <Tab title="مستقیم (پلتفرم Arcee)">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-api-key \
      --arceeai-api-key "$ARCEEAI_API_KEY"
    ```
  </Tab>

  <Tab title="از طریق OpenRouter">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-openrouter \
      --openrouter-api-key "$OPENROUTER_API_KEY"
    ```
  </Tab>
</Tabs>

## کاتالوگ داخلی

OpenClaw در حال حاضر این کاتالوگ Arcee همراه را ارائه می‌کند:

| ارجاع مدل                      | نام                   | ورودی | زمینه | هزینه (ورودی/خروجی به‌ازای هر ۱ میلیون) | یادداشت‌ها                                     |
| ------------------------------ | ---------------------- | ----- | ------- | -------------------- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | text  | 256K    | $0.25 / $0.90        | مدل پیش‌فرض؛ استدلال فعال است          |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | text  | 128K    | $0.25 / $1.00        | همه‌منظوره؛ 400B پارامتر، 13B فعال  |
| `arcee/trinity-mini`           | Trinity Mini 26B       | text  | 128K    | $0.045 / $0.15       | سریع و مقرون‌به‌صرفه؛ فراخوانی تابع |

<Tip>
پیش‌تنظیم راه‌اندازی اولیه، `arcee/trinity-large-thinking` را به‌عنوان مدل پیش‌فرض تنظیم می‌کند.
</Tip>

## قابلیت‌های پشتیبانی‌شده

| قابلیت                                       | پشتیبانی                    |
| --------------------------------------------- | ---------------------------- |
| جریان‌دهی                                     | بله                          |
| استفاده از ابزار / فراخوانی تابع                   | بله                          |
| خروجی ساختاریافته (حالت JSON و طرح‌واره JSON) | بله                          |
| تفکر توسعه‌یافته                             | بله (Trinity Large Thinking) |

<AccordionGroup>
  <Accordion title="یادداشت محیط">
    اگر Gateway به‌صورت daemon (launchd/systemd) اجرا می‌شود، مطمئن شوید `ARCEEAI_API_KEY`
    (یا `OPENROUTER_API_KEY`) برای آن فرایند در دسترس است (برای مثال، در
    `~/.openclaw/.env` یا از طریق `env.shellEnv`).
  </Accordion>

  <Accordion title="مسیریابی OpenRouter">
    هنگام استفاده از مدل‌های Arcee از طریق OpenRouter، همان ارجاع‌های مدل `arcee/*` اعمال می‌شوند.
    OpenClaw مسیریابی را بر اساس انتخاب احراز هویت شما به‌صورت شفاف مدیریت می‌کند. برای جزئیات پیکربندی اختصاصی OpenRouter، به
    [مستندات ارائه‌دهنده OpenRouter](/fa/providers/openrouter) مراجعه کنید.
  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/fa/providers/openrouter" icon="shuffle">
    به مدل‌های Arcee و بسیاری مدل‌های دیگر از طریق یک کلید API واحد دسترسی پیدا کنید.
  </Card>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل، و رفتار failover.
  </Card>
</CardGroup>
