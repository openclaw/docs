---
read_when:
    - می‌خواهید از Arcee AI همراه با OpenClaw استفاده کنید
    - به متغیر محیطی کلید API یا گزینه احراز هویت CLI نیاز دارید
summary: راه‌اندازی Arcee AI (احراز هویت + انتخاب مدل)
title: Arcee AI
x-i18n:
    generated_at: "2026-07-12T10:42:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe519393db3cf39f1b14b8121603b6f667102ac8c122fb6560d9b73a6ee6b0a3
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) خانواده مدل‌های ترکیب متخصصان Trinity را از طریق یک API سازگار با OpenAI ارائه می‌دهد. همه مدل‌های Trinity تحت مجوز Apache 2.0 هستند. Arcee یک Plugin رسمی OpenClaw است و همراه با هسته ارائه نمی‌شود؛ بنابراین پیش از راه‌اندازی اولیه باید نصب شود.

از طریق پلتفرم Arcee یا [OpenRouter](/fa/providers/openrouter) مستقیماً به مدل‌های Arcee دسترسی پیدا کنید.

| ویژگی | مقدار                                                                                 |
| -------- | ------------------------------------------------------------------------------------- |
| ارائه‌دهنده | `arcee`                                                                               |
| احراز هویت     | `ARCEEAI_API_KEY` (مستقیم) یا `OPENROUTER_API_KEY` (از طریق OpenRouter)                   |
| API      | سازگار با OpenAI                                                                     |
| نشانی پایه | `https://api.arcee.ai/api/v1` (مستقیم) یا `https://openrouter.ai/api/v1` (OpenRouter) |

## نصب Plugin

```bash
openclaw plugins install @openclaw/arcee-provider
openclaw gateway restart
```

## شروع به کار

<Tabs>
  <Tab title="مستقیم (پلتفرم Arcee)">
    <Steps>
      <Step title="دریافت کلید API">
        در [Arcee AI](https://chat.arcee.ai/) یک کلید API ایجاد کنید.
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
        در [OpenRouter](https://openrouter.ai/keys) یک کلید API ایجاد کنید.
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

        ارجاع‌های مدل یکسان برای هر دو پیکربندی مستقیم و OpenRouter کار می‌کنند.
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

| ارجاع مدل                      | نام                   | ورودی | زمینه | حداکثر خروجی | هزینه (ورودی/خروجی به‌ازای هر ۱ میلیون) | ابزارها | یادداشت‌ها                                     |
| ------------------------------ | ---------------------- | ----- | ------- | ---------- | -------------------- | ----- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | متن  | ۲۵۶K    | ۸۰K        | $0.25 / $0.90        | خیر    | مدل پیش‌فرض؛ تفکر گسترده          |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | متن  | ۱۲۸K    | ۱۶K        | $0.25 / $1.00        | بله   | چندمنظوره؛ ۴۰۰ میلیارد پارامتر، ۱۳ میلیارد فعال  |
| `arcee/trinity-mini`           | Trinity Mini 26B       | متن  | ۱۲۸K    | ۸۰K        | $0.045 / $0.15       | بله   | سریع و مقرون‌به‌صرفه؛ فراخوانی تابع |

<Tip>
پیش‌تنظیم راه‌اندازی اولیه، `arcee/trinity-large-thinking` را به‌عنوان مدل پیش‌فرض تنظیم می‌کند.
</Tip>

## قابلیت‌های پشتیبانی‌شده

| قابلیت                                       | پشتیبانی                                    |
| --------------------------------------------- | -------------------------------------------- |
| پخش جریانی                                     | بله                                          |
| استفاده از ابزار / فراخوانی تابع                   | بله (Trinity Mini، Trinity Large Preview)    |
| خروجی ساخت‌یافته (حالت JSON و شِمای JSON) | بله                                          |
| تفکر گسترده                             | بله (Trinity Large Thinking؛ ابزارها غیرفعال‌اند) |

<AccordionGroup>
  <Accordion title="نکته محیطی">
    اگر Gateway به‌صورت یک سرویس پس‌زمینه (launchd/systemd) اجرا می‌شود، مطمئن شوید `ARCEEAI_API_KEY`
    (یا `OPENROUTER_API_KEY`) برای آن فرایند در دسترس است؛ برای مثال در
    `~/.openclaw/.env` یا از طریق `env.shellEnv`.
  </Accordion>

  <Accordion title="مسیریابی OpenRouter">
    هنگام استفاده از مدل‌های Arcee از طریق OpenRouter، همان ارجاع‌های مدل `arcee/*` اعمال می‌شوند.
    OpenClaw بر اساس انتخاب احراز هویت شما به‌صورت شفاف مسیریابی می‌کند. برای جزئیات پیکربندی
    مختص OpenRouter، [مستندات ارائه‌دهنده OpenRouter](/fa/providers/openrouter) را ببینید.
  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/fa/providers/openrouter" icon="shuffle">
    با یک کلید API به مدل‌های Arcee و بسیاری مدل‌های دیگر دسترسی پیدا کنید.
  </Card>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل و رفتار جایگزینی هنگام خرابی.
  </Card>
</CardGroup>
