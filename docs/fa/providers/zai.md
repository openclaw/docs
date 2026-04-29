---
read_when:
    - می‌خواهید مدل‌های Z.AI / GLM را در OpenClaw داشته باشید
    - به یک راه‌اندازی سادهٔ ZAI_API_KEY نیاز دارید
summary: از Z.AI (مدل‌های GLM) با OpenClaw استفاده کنید
title: Z.AI
x-i18n:
    generated_at: "2026-04-29T23:30:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0192797b9e023065a384b0428830e73877a5088d2c40c2190d5322273294607d
    source_path: providers/zai.md
    workflow: 16
---

Z.AI پلتفرم API برای مدل‌های **GLM** است. این پلتفرم REST APIهایی برای GLM ارائه می‌دهد و برای احراز هویت از کلیدهای API استفاده می‌کند. کلید API خود را در کنسول Z.AI بسازید. OpenClaw از ارائه‌دهنده `zai` همراه با یک کلید API از Z.AI استفاده می‌کند.

- ارائه‌دهنده: `zai`
- احراز هویت: `ZAI_API_KEY`
- API: تکمیل‌های گفت‌وگوی Z.AI (احراز هویت Bearer)

## شروع به کار

<Tabs>
  <Tab title="تشخیص خودکار نقطه پایانی">
    **بهترین برای:** بیشتر کاربران. OpenClaw نقطه پایانی منطبق Z.AI را از روی کلید تشخیص می‌دهد و URL پایه درست را به‌طور خودکار اعمال می‌کند.

    <Steps>
      <Step title="اجرای راه‌اندازی اولیه">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="تنظیم یک مدل پیش‌فرض">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="بررسی در دسترس بودن مدل">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="نقطه پایانی منطقه‌ای صریح">
    **بهترین برای:** کاربرانی که می‌خواهند یک Coding Plan یا سطح API عمومی مشخص را الزام کنند.

    <Steps>
      <Step title="انتخاب گزینه راه‌اندازی اولیه درست">
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
      <Step title="تنظیم یک مدل پیش‌فرض">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="بررسی در دسترس بودن مدل">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## کاتالوگ داخلی

OpenClaw در حال حاضر ارائه‌دهنده همراه `zai` را با این موارد مقداردهی اولیه می‌کند:

| مرجع مدل             | یادداشت‌ها    |
| -------------------- | ------------- |
| `zai/glm-5.1`        | مدل پیش‌فرض   |
| `zai/glm-5`          |               |
| `zai/glm-5-turbo`    |               |
| `zai/glm-5v-turbo`   |               |
| `zai/glm-4.7`        |               |
| `zai/glm-4.7-flash`  |               |
| `zai/glm-4.7-flashx` |               |
| `zai/glm-4.6`        |               |
| `zai/glm-4.6v`       |               |
| `zai/glm-4.5`        |               |
| `zai/glm-4.5-air`    |               |
| `zai/glm-4.5-flash`  |               |
| `zai/glm-4.5v`       |               |

<Tip>
مدل‌های GLM به‌صورت `zai/<model>` در دسترس هستند (مثال: `zai/glm-5`). مرجع مدل پیش‌فرض همراه، `zai/glm-5.1` است.
</Tip>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="حل رو به جلو مدل‌های ناشناخته GLM-5">
    شناسه‌های ناشناخته `glm-5*` همچنان در مسیر ارائه‌دهنده همراه به‌صورت رو به جلو حل می‌شوند؛
    این کار با ساخت فراداده تحت مالکیت ارائه‌دهنده از قالب `glm-4.7` انجام می‌شود، زمانی که شناسه
    با شکل فعلی خانواده GLM-5 منطبق باشد.
  </Accordion>

  <Accordion title="استریم کردن فراخوانی ابزار">
    `tool_stream` به‌طور پیش‌فرض برای استریم کردن فراخوانی ابزار Z.AI فعال است. برای غیرفعال کردن آن:

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
    OpenClaw مقدار `thinking: { type: "disabled" }` را ارسال می‌کند تا از پاسخ‌هایی جلوگیری کند که
    پیش از متن قابل مشاهده، بودجه خروجی را صرف `reasoning_content` می‌کنند.

    تفکر حفظ‌شده انتخابی است، چون Z.AI نیاز دارد کل `reasoning_content` تاریخی
    دوباره پخش شود، که توکن‌های پرامپت را افزایش می‌دهد. آن را برای هر مدل فعال کنید:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/glm-5.1": {
              params: { preserveThinking: true },
            },
          },
        },
      },
    }
    ```

    وقتی فعال باشد و تفکر روشن باشد، OpenClaw مقدار
    `thinking: { type: "enabled", clear_thinking: false }` را ارسال می‌کند و
    `reasoning_content` قبلی را برای همان رونوشت سازگار با OpenAI دوباره پخش می‌کند.

    کاربران پیشرفته همچنان می‌توانند بار دقیق ارائه‌دهنده را با
    `params.extra_body.thinking` بازنویسی کنند.

  </Accordion>

  <Accordion title="درک تصویر">
    Plugin همراه Z.AI درک تصویر را ثبت می‌کند.

    | ویژگی        | مقدار      |
    | ------------- | ----------- |
    | مدل           | `glm-4.6v`  |

    درک تصویر به‌طور خودکار از احراز هویت پیکربندی‌شده Z.AI حل می‌شود؛
    هیچ پیکربندی اضافی لازم نیست.

  </Accordion>

  <Accordion title="جزئیات احراز هویت">
    - Z.AI از احراز هویت Bearer همراه با کلید API شما استفاده می‌کند.
    - گزینه راه‌اندازی اولیه `zai-api-key` نقطه پایانی منطبق Z.AI را از پیشوند کلید به‌طور خودکار تشخیص می‌دهد.
    - وقتی می‌خواهید یک سطح API مشخص را الزام کنید، از گزینه‌های منطقه‌ای صریح (`zai-coding-global`، `zai-coding-cn`، `zai-global`، `zai-cn`) استفاده کنید.

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="خانواده مدل GLM" href="/fa/providers/glm" icon="microchip">
    نمای کلی خانواده مدل برای GLM.
  </Card>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، مراجع مدل، و رفتار جایگزینی هنگام خرابی.
  </Card>
</CardGroup>
