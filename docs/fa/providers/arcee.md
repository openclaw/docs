---
read_when:
    - می‌خواهید از Arcee AI با OpenClaw استفاده کنید
    - به متغیر محیطی کلید API یا انتخاب احراز هویت CLI نیاز دارید
summary: راه‌اندازی Arcee AI (احراز هویت + انتخاب مدل)
title: Arcee AI
x-i18n:
    generated_at: "2026-05-07T15:08:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c3775ac2783da0833988c68621bd81c73a3b3e8240c26b4c1b590c1e9df2a8f
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) دسترسی به خانواده Trinity از مدل‌های ترکیب متخصصان را از طریق رابط برنامه‌نویسی کاربردی سازگار با OpenAI فراهم می‌کند. همه مدل‌های Trinity تحت مجوز Apache 2.0 منتشر شده‌اند.

مدل‌های Arcee AI را می‌توان مستقیما از طریق پلتفرم Arcee یا از طریق [OpenRouter](/fa/providers/openrouter) در دسترس داشت.

| ویژگی | مقدار                                                                                 |
| -------- | ------------------------------------------------------------------------------------- |
| ارائه‌دهنده | `arcee`                                                                               |
| احراز هویت     | `ARCEEAI_API_KEY` (مستقیم) یا `OPENROUTER_API_KEY` (از طریق OpenRouter)                   |
| رابط برنامه‌نویسی کاربردی      | سازگار با OpenAI                                                                     |
| URL پایه | `https://api.arcee.ai/api/v1` (مستقیم) یا `https://openrouter.ai/api/v1` (OpenRouter) |

## شروع کار

<Tabs>
  <Tab title="مستقیم (پلتفرم Arcee)">
    <Steps>
      <Step title="دریافت کلید رابط برنامه‌نویسی کاربردی">
        در [Arcee AI](https://chat.arcee.ai/) یک کلید رابط برنامه‌نویسی کاربردی ایجاد کنید.
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
      <Step title="دریافت کلید رابط برنامه‌نویسی کاربردی">
        در [OpenRouter](https://openrouter.ai/keys) یک کلید رابط برنامه‌نویسی کاربردی ایجاد کنید.
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

        همان ارجاع‌های مدل برای هر دو راه‌اندازی مستقیم و OpenRouter کار می‌کنند (برای مثال `arcee/trinity-large-thinking`).
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

| ارجاع مدل                      | نام                   | ورودی | زمینه | هزینه (ورودی/خروجی به ازای هر 1M) | یادداشت‌ها                                     |
| ------------------------------ | ---------------------- | ----- | ------- | -------------------- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | متن  | 256K    | $0.25 / $0.90        | مدل پیش‌فرض؛ استدلال فعال است          |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | متن  | 128K    | $0.25 / $1.00        | چندمنظوره؛ 400B پارامتر، 13B فعال  |
| `arcee/trinity-mini`           | Trinity Mini 26B       | متن  | 128K    | $0.045 / $0.15       | سریع و مقرون‌به‌صرفه؛ فراخوانی تابع |

<Tip>
پیش‌تنظیم راه‌اندازی اولیه، `arcee/trinity-large-thinking` را به عنوان مدل پیش‌فرض تنظیم می‌کند.
</Tip>

## قابلیت‌های پشتیبانی‌شده

| قابلیت                                       | پشتیبانی‌شده                                    |
| --------------------------------------------- | -------------------------------------------- |
| استریمینگ                                     | بله                                          |
| استفاده از ابزار / فراخوانی تابع                   | بله (Trinity Mini، Trinity Large Preview)    |
| خروجی ساخت‌یافته (حالت JSON و طرح‌واره JSON) | بله                                          |
| تفکر گسترده                             | بله (Trinity Large Thinking؛ ابزارها غیرفعال‌اند) |

<AccordionGroup>
  <Accordion title="نکته محیطی">
    اگر Gateway به صورت daemon (launchd/systemd) اجرا می‌شود، مطمئن شوید `ARCEEAI_API_KEY`
    (یا `OPENROUTER_API_KEY`) برای آن فرایند در دسترس است (برای مثال، در
    `~/.openclaw/.env` یا از طریق `env.shellEnv`).
  </Accordion>

  <Accordion title="مسیریابی OpenRouter">
    هنگام استفاده از مدل‌های Arcee از طریق OpenRouter، همان ارجاع‌های مدل `arcee/*` اعمال می‌شوند.
    OpenClaw مسیریابی را بر اساس انتخاب احراز هویت شما به‌صورت شفاف مدیریت می‌کند. برای جزئیات
    پیکربندی مخصوص OpenRouter، [مستندات ارائه‌دهنده OpenRouter](/fa/providers/openrouter) را ببینید.
  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/fa/providers/openrouter" icon="shuffle">
    به مدل‌های Arcee و بسیاری مدل‌های دیگر از طریق یک کلید رابط برنامه‌نویسی کاربردی واحد دسترسی پیدا کنید.
  </Card>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل، و رفتار failover.
  </Card>
</CardGroup>
