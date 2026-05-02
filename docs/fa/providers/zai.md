---
read_when:
    - می‌خواهید مدل‌های Z.AI / GLM را در OpenClaw داشته باشید
    - به یک راه‌اندازی ساده برای ZAI_API_KEY نیاز دارید
summary: استفاده از Z.AI (مدل‌های GLM) با OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-05-02T12:01:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 423fc2bc27c62352d9d9acd13c70aa2bc3804112dab25aa46505e844cb166c93
    source_path: providers/zai.md
    workflow: 16
---

Z.AI پلتفرم API برای مدل‌های **GLM** است. این پلتفرم APIهای REST را برای GLM فراهم می‌کند و برای احراز هویت از کلیدهای API استفاده می‌کند. کلید API خود را در کنسول Z.AI بسازید. OpenClaw از ارائه‌دهنده‌ی `zai` با یک کلید API مربوط به Z.AI استفاده می‌کند.

- ارائه‌دهنده: `zai`
- احراز هویت: `ZAI_API_KEY`
- API: تکمیل‌های گفت‌وگوی Z.AI (احراز هویت Bearer)

## شروع به کار

<Tabs>
  <Tab title="Auto-detect endpoint">
    **بهترین گزینه برای:** بیشتر کاربران. OpenClaw نقطه پایانی منطبق Z.AI را از روی کلید تشخیص می‌دهد و URL پایه‌ی درست را به‌صورت خودکار اعمال می‌کند.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Verify the model is listed">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Explicit regional endpoint">
    **بهترین گزینه برای:** کاربرانی که می‌خواهند یک Coding Plan مشخص یا سطح عمومی API را اجباری کنند.

    <Steps>
      <Step title="Pick the right onboarding choice">
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
      <Step title="Set a default model">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Verify the model is listed">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## کاتالوگ داخلی

OpenClaw کاتالوگ ارائه‌دهنده‌ی همراه `zai` را در مانیفست Plugin ارائه می‌کند، بنابراین فهرست‌گیری فقط‌خواندنی می‌تواند ردیف‌های شناخته‌شده‌ی GLM را بدون بارگذاری runtime ارائه‌دهنده نشان دهد:

```bash
openclaw models list --all --provider zai
```

کاتالوگ مبتنی بر مانیفست در حال حاضر شامل این موارد است:

| ارجاع مدل            | یادداشت‌ها         |
| -------------------- | ------------- |
| `zai/glm-5.1`        | مدل پیش‌فرض |
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
مدل‌های GLM به‌صورت `zai/<model>` در دسترس هستند (نمونه: `zai/glm-5`). ارجاع مدل همراه پیش‌فرض `zai/glm-5.1` است.
</Tip>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="Forward-resolving unknown GLM-5 models">
    شناسه‌های ناشناخته‌ی `glm-5*` همچنان در مسیر ارائه‌دهنده‌ی همراه، با ساخت فراداده‌ی متعلق به ارائه‌دهنده از الگوی `glm-4.7`، forward-resolve می‌شوند؛ البته زمانی که شناسه با شکل فعلی خانواده‌ی GLM-5 منطبق باشد.
  </Accordion>

  <Accordion title="Tool-call streaming">
    `tool_stream` به‌صورت پیش‌فرض برای پخش جریانی فراخوانی ابزار در Z.AI فعال است. برای غیرفعال‌کردن آن:

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

  <Accordion title="Thinking and preserved thinking">
    تفکر Z.AI از کنترل‌های `/think` در OpenClaw پیروی می‌کند. وقتی تفکر خاموش باشد، OpenClaw مقدار `thinking: { type: "disabled" }` را ارسال می‌کند تا از پاسخ‌هایی جلوگیری کند که پیش از متن قابل مشاهده، بودجه‌ی خروجی را صرف `reasoning_content` می‌کنند.

    تفکر حفظ‌شده اختیاری است، چون Z.AI نیاز دارد کل `reasoning_content` تاریخی دوباره پخش شود، که توکن‌های پرامپت را افزایش می‌دهد. آن را برای هر مدل فعال کنید:

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

    وقتی فعال باشد و تفکر روشن باشد، OpenClaw مقدار `thinking: { type: "enabled", clear_thinking: false }` را ارسال می‌کند و `reasoning_content` قبلی را برای همان متن گفت‌وگوی سازگار با OpenAI دوباره پخش می‌کند.

    کاربران پیشرفته همچنان می‌توانند payload دقیق ارائه‌دهنده را با `params.extra_body.thinking` بازنویسی کنند.

  </Accordion>

  <Accordion title="Image understanding">
    Plugin همراه Z.AI فهم تصویر را ثبت می‌کند.

    | ویژگی      | مقدار       |
    | ------------- | ----------- |
    | مدل         | `glm-4.6v`  |

    فهم تصویر به‌صورت خودکار از احراز هویت پیکربندی‌شده‌ی Z.AI resolve می‌شود؛ هیچ پیکربندی اضافه‌ای لازم نیست.

  </Accordion>

  <Accordion title="Auth details">
    - Z.AI از احراز هویت Bearer با کلید API شما استفاده می‌کند.
    - گزینه‌ی onboarding با نام `zai-api-key` نقطه پایانی منطبق Z.AI را از روی پیشوند کلید به‌صورت خودکار تشخیص می‌دهد.
    - وقتی می‌خواهید یک سطح API مشخص را اجباری کنید، از گزینه‌های منطقه‌ای صریح (`zai-coding-global`، `zai-coding-cn`، `zai-global`، `zai-cn`) استفاده کنید.

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="GLM model family" href="/fa/providers/glm" icon="microchip">
    نمای کلی خانواده‌ی مدل‌های GLM.
  </Card>
  <Card title="Model selection" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل، و رفتار failover.
  </Card>
</CardGroup>
