---
read_when:
    - شما مدل‌های Z.AI / GLM را در OpenClaw می‌خواهید
    - به یک راه‌اندازی ساده‌ی ZAI_API_KEY نیاز دارید
summary: از Z.AI (مدل‌های GLM) با OpenClaw استفاده کنید
title: Z.AI
x-i18n:
    generated_at: "2026-06-27T18:46:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a40675d3db518c090828bcc46c3bca348d1bed1027ba6b80228aa27773efd10f
    source_path: providers/zai.md
    workflow: 16
---

Z.AI پلتفرم API برای مدل‌های **GLM** است. این پلتفرم REST APIهایی برای GLM ارائه می‌کند و
برای احراز هویت از کلیدهای API استفاده می‌کند. کلید API خود را در کنسول Z.AI بسازید.
OpenClaw از ارائه‌دهنده `zai` همراه با یک کلید API متعلق به Z.AI استفاده می‌کند.

| ویژگی | مقدار                                       |
| -------- | -------------------------------------------- |
| ارائه‌دهنده | `zai`                                        |
| بسته  | `@openclaw/zai-provider`                     |
| احراز هویت     | `ZAI_API_KEY` (نام مستعار قدیمی: `Z_AI_API_KEY`) |
| API      | تکمیل‌های چت Z.AI (احراز هویت Bearer)          |

## مدل‌های GLM

GLM یک خانواده مدل است، نه یک ارائه‌دهنده جداگانه. در OpenClaw، مدل‌های GLM از
ارجاع‌هایی مانند `zai/glm-5.2` استفاده می‌کنند: ارائه‌دهنده `zai`، شناسه مدل `glm-5.2`.

## شروع به کار

ابتدا Plugin ارائه‌دهنده را نصب کنید:

```bash
openclaw plugins install @openclaw/zai-provider
```

<Tabs>
  <Tab title="تشخیص خودکار endpoint">
    **بهترین برای:** بیشتر کاربران. OpenClaw endpointهای پشتیبانی‌شده Z.AI را با کلید API شما بررسی می‌کند و URL پایه درست را به‌صورت خودکار اعمال می‌کند.

    <Steps>
      <Step title="اجرای راه‌اندازی اولیه">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="بررسی کنید که مدل فهرست شده باشد">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="endpoint منطقه‌ای صریح">
    **بهترین برای:** کاربرانی که می‌خواهند یک Coding Plan مشخص یا سطح API عمومی مشخصی را اجبار کنند.

    <Steps>
      <Step title="انتخاب گزینه درست راه‌اندازی اولیه">
        ```bash
        # Coding Plan Global (recommended for Coding Plan users)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (China region)
        openclaw onboard --auth-choice zai-coding-cn

        # General API
        openclaw onboard --auth-choice zai-global

        # General API CN (China region)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="بررسی کنید که مدل فهرست شده باشد">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## نمونه پیکربندی

<Tip>
`zai-api-key` به OpenClaw امکان می‌دهد endpoint متناظر Z.AI را از روی کلید تشخیص دهد و
URL پایه درست را به‌صورت خودکار اعمال کند. وقتی می‌خواهید یک Coding Plan مشخص یا سطح API
عمومی مشخصی را اجبار کنید، از گزینه‌های منطقه‌ای صریح استفاده کنید.
</Tip>

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  models: {
    providers: {
      zai: {
        // GLM-5.2 uses the Coding Plan endpoint.
        baseUrl: "https://api.z.ai/api/coding/paas/v4",
      },
    },
  },
  agents: { defaults: { model: { primary: "zai/glm-5.2" } } },
}
```

## کاتالوگ داخلی

Plugin ارائه‌دهنده `zai` کاتالوگ خود را در مانیفست Plugin عرضه می‌کند، بنابراین فهرست‌کردن
فقط‌خواندنی می‌تواند ردیف‌های شناخته‌شده GLM را بدون بارگذاری runtime ارائه‌دهنده نشان دهد:

```bash
openclaw models list --all --provider zai
```

کاتالوگ مبتنی بر مانیفست در حال حاضر شامل این موارد است:

| ارجاع مدل            | یادداشت‌ها                           |
| -------------------- | ------------------------------- |
| `zai/glm-5.2`        | پیش‌فرض Coding Plan؛ زمینه 1M |
| `zai/glm-5.1`        | پیش‌فرض API عمومی             |
| `zai/glm-5`          |                                 |
| `zai/glm-5-turbo`    |                                 |
| `zai/glm-5v-turbo`   |                                 |
| `zai/glm-4.7`        |                                 |
| `zai/glm-4.7-flash`  |                                 |
| `zai/glm-4.7-flashx` |                                 |
| `zai/glm-4.6`        |                                 |
| `zai/glm-4.6v`       |                                 |
| `zai/glm-4.5`        |                                 |
| `zai/glm-4.5-air`    |                                 |
| `zai/glm-4.5-flash`  |                                 |
| `zai/glm-4.5v`       |                                 |

<Tip>
مدل‌های GLM به‌صورت `zai/<model>` در دسترس هستند (مثال: `zai/glm-5`).
</Tip>

<Tip>
GLM-5.2 از سطوح تفکر `off`، `low`، `high` و `max` پشتیبانی می‌کند. OpenClaw
`low` و `high` را به تلاش استدلالی بالای Z.AI و `max` را به بیشینه تلاش نگاشت می‌کند.
</Tip>

<Note>
راه‌اندازی Coding Plan به‌طور پیش‌فرض از `zai/glm-5.2` استفاده می‌کند؛ راه‌اندازی API عمومی
`zai/glm-5.1` را نگه می‌دارد. تشخیص خودکار endpoint وقتی طرح انتخاب‌شده GLM-5.2 را ارائه نکند،
به `glm-5.1` یا `glm-4.7` برمی‌گردد. نسخه‌ها و دسترس‌پذیری GLM
می‌توانند تغییر کنند؛ برای دیدن کاتالوگ شناخته‌شده برای نسخه نصب‌شده خود، `openclaw models list --all --provider zai` را اجرا کنید.
</Note>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="حل رو به جلو مدل‌های ناشناخته GLM-5">
    شناسه‌های ناشناخته `glm-5*` همچنان در مسیر ارائه‌دهنده به‌صورت رو به جلو حل می‌شوند؛
    این کار با ساخت فراداده تحت مالکیت ارائه‌دهنده از قالب `glm-4.7` انجام می‌شود، وقتی شناسه
    با شکل فعلی خانواده GLM-5 مطابقت داشته باشد.
  </Accordion>

  <Accordion title="استریم فراخوانی ابزار">
    `tool_stream` به‌طور پیش‌فرض برای استریم فراخوانی ابزار Z.AI فعال است. برای غیرفعال‌کردن آن:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/<model>": {
              params: { tool_stream: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="تفکر و تفکر حفظ‌شده">
    تفکر Z.AI از کنترل‌های `/think` در OpenClaw پیروی می‌کند. وقتی تفکر خاموش باشد،
    OpenClaw مقدار `thinking: { type: "disabled" }` را می‌فرستد تا از پاسخ‌هایی جلوگیری کند که
    پیش از متن قابل مشاهده، بودجه خروجی را صرف `reasoning_content` می‌کنند.

    تفکر حفظ‌شده اختیاری است، زیرا Z.AI نیاز دارد کل
    `reasoning_content` تاریخی بازپخش شود، که توکن‌های prompt را افزایش می‌دهد. آن را
    برای هر مدل فعال کنید:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/glm-5.2": {
              params: { preserveThinking: true },
            },
          },
        },
      },
    }
    ```

    وقتی فعال باشد و تفکر روشن باشد، OpenClaw مقدار
    `thinking: { type: "enabled", clear_thinking: false }` را می‌فرستد و
    `reasoning_content` قبلی را برای همان transcript سازگار با OpenAI بازپخش می‌کند.

    کاربران پیشرفته همچنان می‌توانند payload دقیق ارائه‌دهنده را با
    `params.extra_body.thinking` بازنویسی کنند.

  </Accordion>

  <Accordion title="درک تصویر">
    Plugin مربوط به Z.AI درک تصویر را ثبت می‌کند.

    | ویژگی      | مقدار       |
    | ------------- | ----------- |
    | مدل         | `glm-4.6v`  |

    درک تصویر به‌صورت خودکار از احراز هویت پیکربندی‌شده Z.AI حل می‌شود؛
    هیچ پیکربندی اضافی لازم نیست.

  </Accordion>

  <Accordion title="جزئیات احراز هویت">
    - Z.AI با کلید API شما از احراز هویت Bearer استفاده می‌کند.
    - گزینه راه‌اندازی اولیه `zai-api-key` با بررسی endpointهای پشتیبانی‌شده با کلید شما، endpoint متناظر Z.AI را به‌صورت خودکار تشخیص می‌دهد.
    - وقتی می‌خواهید یک سطح API مشخص را اجبار کنید، از گزینه‌های منطقه‌ای صریح (`zai-coding-global`، `zai-coding-cn`، `zai-global`، `zai-cn`) استفاده کنید.
    - متغیر محیطی قدیمی `Z_AI_API_KEY` همچنان پذیرفته می‌شود؛ اگر `ZAI_API_KEY` تنظیم نشده باشد، OpenClaw هنگام شروع آن را در `ZAI_API_KEY` کپی می‌کند.

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهنده‌ها، ارجاع‌های مدل، و رفتار failover.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    شِمای کامل پیکربندی OpenClaw، شامل تنظیمات ارائه‌دهنده و مدل.
  </Card>
</CardGroup>
